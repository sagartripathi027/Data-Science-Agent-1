import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Database, FileSpreadsheet, Plus, Settings, MessageSquare, Trash2, Menu, X } from 'lucide-react';
import { useListSessions, useDeleteSession } from '@workspace/api-client-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: sessions, isLoading } = useListSessions();
  const { mutate: deleteSession } = useDeleteSession();
  const queryClient = useQueryClient();
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this analysis session?')) {
      deleteSession({ sessionId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/analysis/sessions'] });
          if (location === `/session/${id}`) {
            setLocation('/');
          }
        }
      });
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-md shadow-lg"
        onClick={() => setSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute md:relative z-40 w-64 h-full bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col shadow-2xl md:shadow-none"
          >
            <div className="p-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <BrainCircuit className="text-white w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg text-foreground tracking-tight">Nexus<span className="text-primary text-glow">AI</span></span>
            </div>

            <div className="px-4 pb-4">
              <Link href="/">
                <button className="w-full flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary hover:text-primary border border-primary/20 hover:border-primary/40 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200">
                  <Plus size={16} />
                  New Analysis
                </button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Recent Sessions</p>
              
              {isLoading ? (
                <div className="space-y-2 px-2">
                  {[1,2,3].map(i => <div key={i} className="h-12 w-full bg-secondary/50 rounded-lg animate-pulse" />)}
                </div>
              ) : sessions?.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No sessions yet
                </div>
              ) : (
                sessions?.map(session => {
                  const isActive = location === `/session/${session.id}`;
                  return (
                    <Link key={session.id} href={`/session/${session.id}`}>
                      <div className={cn(
                        "group flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200",
                        isActive ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                      )}>
                        <div className="flex items-center gap-3 overflow-hidden">
                          <MessageSquare size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                          <div className="truncate text-sm font-medium">
                            {session.name}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => handleDelete(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>

            <div className="p-4 border-t border-border/50">
              <button className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full px-3 py-2 rounded-lg hover:bg-secondary/50">
                <Settings size={18} />
                Settings
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col h-full bg-background overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none -z-10" />
        
        {children}
      </main>
    </div>
  );
}
