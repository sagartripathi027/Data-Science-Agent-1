import { Router, type IRouter } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { db, datasetsTable, sessionsTable, messagesTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  parseCSV,
  parseJSON,
  computeMissingValues,
  computeSummary,
} from "./dataParser.js";
import { buildSystemPrompt, buildDatasetContext } from "./agentPrompt.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "missing_file", message: "No file uploaded" });
      return;
    }

    const filename = file.originalname;
    const content = file.buffer.toString("utf-8");
    const ext = filename.split(".").pop()?.toLowerCase();

    let parsed;
    try {
      if (ext === "json") {
        parsed = parseJSON(content);
      } else {
        parsed = parseCSV(content);
      }
    } catch (parseErr) {
      res.status(400).json({ error: "parse_error", message: `Failed to parse file: ${(parseErr as Error).message}` });
      return;
    }

    const { rows, columnNames, columnTypes } = parsed;
    const missingValues = computeMissingValues(rows, columnNames);
    const summary = computeSummary(rows, columnNames, columnTypes);
    const preview = rows.slice(0, 20);
    const datasetId = uuidv4();

    await db.insert(datasetsTable).values({
      id: datasetId,
      filename,
      rows: rows.length,
      columns: columnNames.length,
      columnNames,
      columnTypes,
      preview,
      missingValues,
      summary,
      rawData: rows,
    });

    res.json({
      datasetId,
      filename,
      rows: rows.length,
      columns: columnNames.length,
      columnNames,
      columnTypes,
      preview,
      missingValues,
      summary,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to process file" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { datasetId, name } = req.body as { datasetId: string; name: string };
    if (!datasetId || !name) {
      res.status(400).json({ error: "missing_fields", message: "datasetId and name are required" });
      return;
    }

    const dataset = await db.select().from(datasetsTable).where(eq(datasetsTable.id, datasetId)).limit(1);
    if (!dataset.length) {
      res.status(404).json({ error: "not_found", message: "Dataset not found" });
      return;
    }

    const sessionId = uuidv4();
    await db.insert(sessionsTable).values({
      id: sessionId,
      name,
      datasetId,
    });

    const ds = dataset[0];
    res.json({
      id: sessionId,
      name,
      datasetId,
      datasetFilename: ds.filename,
      datasetRows: ds.rows,
      datasetColumns: ds.columns,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to create session" });
  }
});

router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await db.select().from(sessionsTable).orderBy(desc(sessionsTable.createdAt));

    const results = await Promise.all(
      sessions.map(async (s) => {
        const ds = await db.select().from(datasetsTable).where(eq(datasetsTable.id, s.datasetId)).limit(1);
        const msgCount = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.sessionId, s.id));
        const dataset = ds[0];
        return {
          id: s.id,
          name: s.name,
          datasetId: s.datasetId,
          datasetFilename: dataset?.filename ?? "Unknown",
          datasetRows: dataset?.rows ?? 0,
          datasetColumns: dataset?.columns ?? 0,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
          messageCount: msgCount[0]?.count ?? 0,
        };
      })
    );

    res.json(results);
  } catch (err) {
    console.error("List sessions error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to list sessions" });
  }
});

router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);

    if (!sessions.length) {
      res.status(404).json({ error: "not_found", message: "Session not found" });
      return;
    }

    const s = sessions[0];
    const ds = await db.select().from(datasetsTable).where(eq(datasetsTable.id, s.datasetId)).limit(1);
    const msgCount = await db.select({ count: count() }).from(messagesTable).where(eq(messagesTable.sessionId, s.id));
    const dataset = ds[0];

    res.json({
      id: s.id,
      name: s.name,
      datasetId: s.datasetId,
      datasetFilename: dataset?.filename ?? "Unknown",
      datasetRows: dataset?.rows ?? 0,
      datasetColumns: dataset?.columns ?? 0,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      messageCount: msgCount[0]?.count ?? 0,
    });
  } catch (err) {
    console.error("Get session error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to get session" });
  }
});

router.delete("/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await db.delete(messagesTable).where(eq(messagesTable.sessionId, sessionId));
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to delete session" });
  }
});

router.post("/sessions/:sessionId/query", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { query } = req.body as { query: string };

    if (!query) {
      res.status(400).json({ error: "missing_query", message: "query is required" });
      return;
    }

    const sessions = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
    if (!sessions.length) {
      res.status(404).json({ error: "not_found", message: "Session not found" });
      return;
    }

    const session = sessions[0];
    const datasets = await db.select().from(datasetsTable).where(eq(datasetsTable.id, session.datasetId)).limit(1);
    if (!datasets.length) {
      res.status(404).json({ error: "not_found", message: "Dataset not found" });
      return;
    }

    const dataset = datasets[0];

    const datasetContext = buildDatasetContext(
      dataset.filename,
      dataset.rows,
      dataset.columns,
      dataset.columnNames,
      dataset.columnTypes,
      dataset.missingValues,
      dataset.summary,
      dataset.rawData
    );

    const previousMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.sessionId, sessionId))
      .orderBy(messagesTable.createdAt)
      .limit(20);

    const chatHistory = previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.role === "assistant" ? m.content : m.content,
    }));

    const userMsgId = uuidv4();
    await db.insert(messagesTable).values({
      id: userMsgId,
      sessionId,
      role: "user",
      content: query,
      sections: [],
      charts: [],
    });

    const systemPrompt = buildSystemPrompt(datasetContext);
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: query },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content ?? "{}";

    let parsed: {
      summary?: string;
      sections?: { title: string; content: string }[];
      charts?: Record<string, unknown>[];
    } = {};

    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      parsed = {
        summary: rawResponse,
        sections: [{ title: "Analysis", content: rawResponse }],
        charts: [],
      };
    }

    const sections = parsed.sections ?? [];
    const charts = (parsed.charts ?? []) as Record<string, unknown>[];
    const summary = parsed.summary ?? sections.map(s => s.content).join("\n\n");

    const assistantMsgId = uuidv4();
    await db.insert(messagesTable).values({
      id: assistantMsgId,
      sessionId,
      role: "assistant",
      content: summary,
      sections,
      charts,
    });

    await db
      .update(sessionsTable)
      .set({ updatedAt: new Date() })
      .where(eq(sessionsTable.id, sessionId));

    res.json({
      messageId: assistantMsgId,
      query,
      response: summary,
      sections,
      charts,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Query agent error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to process query" });
  }
});

router.get("/sessions/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const msgs = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.sessionId, sessionId))
      .orderBy(messagesTable.createdAt);

    res.json(
      msgs.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        sections: m.sections ?? [],
        charts: m.charts ?? [],
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: "internal_error", message: "Failed to get messages" });
  }
});

export default router;
