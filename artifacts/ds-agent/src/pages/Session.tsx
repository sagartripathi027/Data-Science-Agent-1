import React, { useState, useRef, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Send, LayoutPanelLeft, Loader2, Info } from 'lucide-react';
import { useGetSession, useGetMessages, useQueryAgent } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatMessage } from '@/components/ChatMessage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Session() {
  const [, params] = useRoute('/session/:id');
  const sessionId = params?.id || '';
  
  const { data: session, isLoading: isSessionLoading } = useGetSession(sessionId);
  const { data: messages, isLoading: isMessagesLoading } = useGetMessages(sessionId);
  const { mutate: sendQuery, isPending: isQuerying } = useQueryAgent();
  
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isQuerying) return;

    const queryText = input;
    setInput('');

    // Optimistically add user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: 'user' as const,
      content: queryText,
      sections: [],
      charts: [],
      createdAt: new Date().toISOString()
    };
    
    queryClient.setQueryData([`/api/analysis/sessions/${sessionId}/messages`], (old: any) => {
      return [...(old || []), tempUserMsg];
    });

    sendQuery(
      { sessionId, data: { query: queryText } },
      {
        onSuccess: () => {
          // Re-fetch messages to get true state and AI response
          queryClient.invalidateQueries({ queryKey: [`/api/analysis/sessions/${sessionId}/messages`] });
        },
        onError: () => {
          // On error, refresh to remove optimistic message
          queryClient.invalidateQueries({ queryKey: [`/api/analysis/sessions/${sessionId}/messages`] });
        }
      }
    );
  };

  if (isSessionLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Session not found.</div>;
  }

  return (
    <div className="flex h-full w-full relative">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-background relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">{session.name}</h2>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span className="truncate max-w-[200px]">{session.datasetFilename}</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{session.datasetRows?.toLocaleString()} rows</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowInfo(!showInfo)}
            className={showInfo ? 'bg-secondary' : ''}
          >
            <LayoutPanelLeft size={20} />
          </Button>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {isMessagesLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : messages?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 mb-6 opacity-80">
                <img src={`${import.meta.env.BASE_URL}images/empty-state.png`} alt="Empty state" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Agent is ready</h3>
              <p className="text-muted-foreground max-w-md">
                Dataset loaded successfully. Ask me to clean the data, generate visualizations, find correlations, or build predictive models.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl">
                {['Show me a summary of missing values', 'Plot a distribution of the main numerical column', 'Find the top 3 correlations'].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="bg-secondary/50 hover:bg-secondary border border-border/50 rounded-full px-4 py-2 text-sm text-foreground/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="pb-8">
              {messages?.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              
              {isQuerying && (
                <div className="flex w-full gap-4 py-6 px-4 md:px-8 bg-muted/30 border-y border-border/40">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-2">
                    <div className="h-4 w-48 bg-secondary/80 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-secondary/60 rounded animate-pulse delay-75" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t border-border/50 shrink-0">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative flex items-end shadow-lg shadow-black/20 rounded-2xl bg-input border border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask the agent to analyze your data..."
              className="w-full max-h-48 min-h-[60px] py-4 pl-5 pr-16 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isQuerying}
              className="absolute right-2 bottom-2 w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 active:scale-95"
            >
              <Send size={18} className={cn(isQuerying && "opacity-0", "absolute")} />
              {isQuerying && <Loader2 size={18} className="animate-spin absolute" />}
            </button>
          </form>
          <div className="text-center mt-2 text-[11px] text-muted-foreground/60">
            Shift+Enter for new line. AI can make mistakes. Check important analyses.
          </div>
        </div>
      </div>

      {/* Right Sidebar - Dataset Info */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-l border-border/50 bg-card/90 backdrop-blur-xl shrink-0 overflow-y-auto"
          >
            <div className="w-[320px] p-5">
              <div className="flex items-center gap-2 mb-6">
                <Info className="text-primary w-5 h-5" />
                <h3 className="font-semibold text-foreground">Dataset Overview</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Rows</div>
                  <div className="text-xl font-mono text-foreground">{session.datasetRows?.toLocaleString()}</div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                  <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Columns</div>
                  <div className="text-xl font-mono text-foreground">{session.datasetColumns}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground/80 border-b border-border/50 pb-2">Properties</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Filename</span>
                    <span className="text-foreground font-mono truncate max-w-[150px]" title={session.datasetFilename}>{session.datasetFilename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">{new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="text-foreground">{session.messageCount || messages?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl text-xs text-primary/80 leading-relaxed">
                <strong className="block mb-1 text-primary">Pro Tip:</strong>
                The AI agent automatically reads the schema and summary statistics of this dataset before answering. You can ask for specific column transformations or multi-variable plots.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
