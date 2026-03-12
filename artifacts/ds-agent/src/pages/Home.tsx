import React, { useCallback, useState } from 'react';
import { useLocation } from 'wouter';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileType, AlertCircle, ArrowRight, TableProperties } from 'lucide-react';
import { useUploadDataset, useCreateSession } from '@workspace/api-client-react';
import { formatBytes } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [sessionName, setSessionName] = useState('');
  
  const { mutate: uploadFile, isPending: isUploading, error: uploadError, data: datasetInfo } = useUploadDataset();
  const { mutate: createSession, isPending: isCreating } = useCreateSession();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      // Auto-upload when dropped
      uploadFile({ data: { file: acceptedFiles[0] } });
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!datasetInfo || !sessionName.trim()) return;

    createSession(
      { data: { datasetId: datasetInfo.datasetId, name: sessionName } },
      {
        onSuccess: (session) => {
          setLocation(`/session/${session.id}`);
        }
      }
    );
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full">
        
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center px-3 py-1 mb-4 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider">
              DATA INTELLIGENCE PLATFORM
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              Autonomous Analysis
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Upload your dataset and let our AI agent uncover patterns, generate visualizations, and provide actionable insights.
            </p>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {!datasetInfo ? (
            <motion.div
              key="upload"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="glass-panel rounded-3xl p-8 text-center"
            >
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer
                  flex flex-col items-center justify-center min-h-[300px]
                  ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-secondary/30'}
                  ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <input {...getInputProps()} />
                
                {isUploading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
                    <p className="text-lg font-medium text-foreground">Analyzing structure...</p>
                    <p className="text-sm text-muted-foreground mt-2">Parsing columns and generating summary</p>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <UploadCloud className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Drop your dataset here</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Supports CSV and JSON files. We'll automatically detect types and handle missing values.
                    </p>
                    <Button variant="outline" className="rounded-full px-8">
                      Browse Files
                    </Button>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-3 text-destructive text-sm text-left">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>Failed to process file. Please ensure it's a valid CSV or JSON dataset.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-panel rounded-3xl p-8"
            >
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <FileType className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{datasetInfo.filename}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><TableProperties size={14}/> {datasetInfo.rows.toLocaleString()} rows</span>
                    <span>•</span>
                    <span>{datasetInfo.columns} columns</span>
                    <span>•</span>
                    <span>{file ? formatBytes(file.size) : 'Unknown size'}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStartAnalysis} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80 ml-1">Name your analysis session</label>
                  <input 
                    type="text"
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    placeholder="e.g., Customer Churn Analysis Q3"
                    className="w-full h-14 bg-input border-2 border-border rounded-xl px-5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-lg"
                    autoFocus
                    required
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-14 w-full rounded-xl text-base"
                    onClick={() => {
                      setFile(null);
                      // Cannot easily clear useMutation data, but changing state hides this view
                      window.location.reload(); 
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!sessionName.trim() || isCreating}
                    className="h-14 w-full rounded-xl text-base gap-2"
                  >
                    {isCreating ? 'Initializing Agent...' : 'Start Agent'}
                    {!isCreating && <ArrowRight size={18} />}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
