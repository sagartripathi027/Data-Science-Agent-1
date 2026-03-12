import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { DynamicChart } from './DynamicChart';
import { cn } from '@/lib/utils';
import type { Message } from '@workspace/api-client-react/src/generated/api.schemas';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-4 py-6 px-4 md:px-8",
        isUser ? "bg-transparent" : "bg-muted/30 border-y border-border/40"
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm",
        isUser ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground shadow-primary/20"
      )}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* Main textual content */}
        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-secondary prose-pre:border prose-pre:border-border max-w-none text-foreground/90 font-sans">
          {message.content.split('\n').map((paragraph, i) => (
             <p key={i} className={paragraph.trim() === '' ? 'hidden' : 'mb-2'}>{paragraph}</p>
          ))}
        </div>

        {/* Structured Sections */}
        {message.sections && message.sections.length > 0 && (
          <div className="grid gap-4 mt-6">
            {message.sections.map((section, idx) => (
              <div key={idx} className="bg-card/50 border border-border/50 rounded-xl p-5 shadow-sm">
                <h4 className="text-sm font-display font-semibold text-primary mb-2 uppercase tracking-wider">{section.title}</h4>
                <div className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="mt-6 w-full">
            {message.charts.map((chart, idx) => (
              <DynamicChart key={idx} chart={chart} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
