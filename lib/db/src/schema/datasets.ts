import { pgTable, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const datasetsTable = pgTable("datasets", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(),
  rows: integer("rows").notNull(),
  columns: integer("columns").notNull(),
  columnNames: jsonb("column_names").$type<string[]>().notNull(),
  columnTypes: jsonb("column_types").$type<Record<string, string>>().notNull(),
  preview: jsonb("preview").$type<Record<string, unknown>[]>().notNull(),
  missingValues: jsonb("missing_values").$type<Record<string, number>>().notNull(),
  summary: jsonb("summary").$type<Record<string, unknown>>().notNull(),
  rawData: jsonb("raw_data").$type<Record<string, unknown>[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDatasetSchema = createInsertSchema(datasetsTable).omit({ createdAt: true });
export type InsertDataset = z.infer<typeof insertDatasetSchema>;
export type Dataset = typeof datasetsTable.$inferSelect;
