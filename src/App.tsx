import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, FileText, Brain, Lightbulb, Target, ArrowRight, 
  Loader2, CheckCircle2, AlertCircle, Copy, History, 
  Trash2, BookOpen, Download, Share2, ExternalLink,
  ChevronRight, Sparkles, Database, Microscope, Info,
  Layers, Cpu, BarChart3, HelpCircle, Moon, Sun, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { extractTextFromPDF } from '@/lib/pdf';
import { analyzeResearchPaper, AnalysisResult } from '@/lib/gemini';

interface ScanHistoryItem {
  id: string;
  fileName: string;
  date: string;
  analysis: AnalysisResult;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'extracting' | 'analyzing'>('idle');
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const videos = [
    "https://cdn.pixabay.com/video/2020/05/25/40134-424930335_large.mp4", // Abstract data/network
    "https://cdn.pixabay.com/video/2021/04/12/70874-537480562_large.mp4", // Digital brain/AI
    "https://cdn.pixabay.com/video/2023/10/20/185731-876174624_large.mp4", // Scientific visualization
    "https://cdn.pixabay.com/video/2019/04/14/22845-331163436_large.mp4", // Neural network nodes
    "https://cdn.pixabay.com/video/2021/04/12/70871-537480559_large.mp4", // Cybernetic grid
    "https://cdn.pixabay.com/video/2020/05/25/40132-424930333_large.mp4", // Data stream flow
    "https://cdn.pixabay.com/video/2022/07/11/123730-728864703_large.mp4"  // Molecular research
  ];

  // Dark mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scholarscan_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('scholarscan_history', JSON.stringify(history));
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | File) => {
    const selectedFile = e instanceof File ? e : e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);
      toast.success(`File "${selectedFile.name}" uploaded successfully.`);
    } else if (selectedFile) {
      setError('Please select a valid PDF file.');
      toast.error('Invalid file type. Only PDFs are supported.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setStep('extracting');
    setProgress(20);

    try {
      // Step 1: Extract Text
      const text = await extractTextFromPDF(file);
      setProgress(50);
      
      setStep('analyzing');
      setProgress(75);
      
      // Step 2: Analyze with Gemini
      const result = await analyzeResearchPaper(text);
      setAnalysis(result);
      setProgress(100);

      // Add to history
      const newHistoryItem: ScanHistoryItem = {
        id: Date.now().toString(),
        fileName: file.name,
        date: new Date().toLocaleDateString(),
        analysis: result
      };
      setHistory(prev => [newHistoryItem, ...prev].slice(0, 10)); // Keep last 10
      
      toast.success('AI Data Mining complete!');
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please try again.');
      toast.error('Analysis failed. Check your connection or file content.');
    } finally {
      setIsAnalyzing(false);
      setStep('idle');
      setTimeout(() => setProgress(0), 500);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast.info('History item removed.');
  };

  const loadFromHistory = (item: ScanHistoryItem) => {
    setAnalysis(item.analysis);
    setFile(null); // Clear current file since we're viewing history
    toast.info(`Viewing analysis for: ${item.fileName}`);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">
        <Toaster position="top-right" />
        
        {/* 3D Video Background & Effects */}
        <div className="video-bg-container">
          <video 
            key={videos[videoIndex]}
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-30 dark:opacity-20 transition-opacity duration-1000"
          >
            <source src={videos[videoIndex]} type="video/mp4" />
          </video>
          
          {/* Scanning Line Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div 
              animate={{ y: ['0%', '1000%'] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-[1px]"
            />
          </div>

          {/* Floating Particles (Simplified) */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.3
                }}
                animate={{ 
                  y: [null, (Math.random() * -20 - 10) + '%'],
                  opacity: [null, 0]
                }}
                transition={{ 
                  duration: Math.random() * 10 + 10, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 10
                }}
                className="absolute w-1 h-1 bg-primary/40 rounded-full blur-[1px]"
              />
            ))}
          </div>

          <div className="video-bg-overlay" />
        </div>
        
        {/* Header */}
        <header className="border-b border-border bg-background/60 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg transition-transform group-hover:rotate-12">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight leading-none ai-gradient-text">Data mine AI</h1>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-1">Advanced Mining Engine</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden sm:flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger 
                    render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary"
                        onClick={() => setVideoIndex((prev) => (prev + 1) % videos.length)}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <TooltipContent>Switch 3D Background</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger 
                    render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    }
                  />
                  <TooltipContent>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block" />

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-muted-foreground hover:text-primary hidden md:flex"
                onClick={() => setShowHowTo(!showHowTo)}
              >
                <HelpCircle className="w-4 h-4 mr-2" /> How it works
              </Button>
              <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider opacity-60 border-border">
                v1.6.0 Pro
              </Badge>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-12">
          
          {/* How to Use Section */}
          <AnimatePresence>
            {showHowTo && (
              <motion.section 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mb-12 overflow-hidden"
              >
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20 shadow-sm backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Info className="w-5 h-5" /> How to use Data mine AI
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: '1. Upload PDF', desc: 'Drag and drop your research paper. Our system extracts the raw text directly in your browser.', icon: <FileUp className="w-6 h-6 text-blue-500" /> },
                      { title: '2. AI Data Mining', desc: 'Gemini 1.5 Flash mines the text for models, datasets, methodology, and key insights.', icon: <Database className="w-6 h-6 text-purple-500" /> },
                      { title: '3. Explore Insights', desc: 'Navigate through structured tabs to see summaries, findings, and future research paths.', icon: <Microscope className="w-6 h-6 text-pink-500" /> },
                    ].map((step, i) => (
                      <div key={i} className="bg-background/40 p-4 rounded-xl border border-border/50 space-y-2 backdrop-blur-sm">
                        <div className="mb-2">{step.icon}</div>
                        <h4 className="font-bold text-foreground">{step.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.section>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Controls & History */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Upload Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Document Source</h2>
                  {file && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setFile(null)}>
                      <Trash2 className="w-3 h-3 mr-1.5" /> Clear
                    </Button>
                  )}
                </div>
                
                <Card className="border-border shadow-sm overflow-hidden bg-card/80 backdrop-blur-sm ai-glow">
                  <CardContent className="p-6 space-y-6">
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`
                        relative border-2 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center gap-4
                        ${isDragging ? 'border-primary bg-primary/10 scale-[0.98]' : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                        ${file ? 'bg-primary/5 border-primary/20' : ''}
                      `}
                    >
                      <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="file-upload" 
                        className="cursor-pointer flex flex-col items-center gap-3 text-center"
                      >
                        {file ? (
                          <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 mb-2">
                              <FileText className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-sm font-bold text-foreground truncate max-w-[200px] mb-1">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF
                            </span>
                          </motion.div>
                        ) : (
                          <>
                            <div className="bg-muted p-4 rounded-2xl text-muted-foreground group-hover:text-primary transition-colors">
                              <FileUp className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-foreground">Drop your paper here</p>
                              <p className="text-xs text-muted-foreground">or click to browse files</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    {isAnalyzing && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span>{step === 'extracting' ? 'Extracting Text' : 'AI Mining'}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-primary/10" />
                      </div>
                    )}

                    <Button 
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 rounded-xl transition-all shadow-lg shadow-blue-500/20 font-bold"
                      disabled={!file || isAnalyzing}
                      onClick={handleAnalyze}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Mining Data...
                        </>
                      ) : (
                        <>
                          Start AI Mining
                          <Database className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {/* History Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3.5 h-3.5" /> Mining History
                  </h2>
                </div>
                
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-card/40 backdrop-blur-sm">
                        <p className="text-xs text-muted-foreground font-medium">No recent mining sessions</p>
                      </div>
                    ) : (
                      history.map((item) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="group relative bg-card/80 backdrop-blur-sm border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-muted p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-foreground truncate pr-4">{item.fileName}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{item.date}</p>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(item.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </section>
            </div>

            {/* Right Column: Results */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {!analysis && !isAnalyzing ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="h-full flex flex-col items-center justify-center text-center p-16 bg-card/80 backdrop-blur-sm rounded-[2rem] border border-border shadow-sm paper-texture relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                      <img 
                        src="https://picsum.photos/seed/ai-mining/1200/800" 
                        alt="AI Background" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-full mb-8 relative z-10">
                      <Database className="w-12 h-12 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-purple-500 p-2 rounded-full animate-pulse">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">AI Data Mining Portal</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed relative z-10">
                      Our advanced AI engine will mine your document for deep technical insights, methodology details, and dataset references.
                    </p>
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl relative z-10">
                      {[
                        { icon: <Cpu className="w-4 h-4" />, label: 'Models' },
                        { icon: <Layers className="w-4 h-4" />, label: 'Datasets' },
                        { icon: <BarChart3 className="w-4 h-4" />, label: 'Metrics' },
                        { icon: <Microscope className="w-4 h-4" />, label: 'Methods' },
                      ].map((feature, i) => (
                        <div key={i} className="bg-background/80 backdrop-blur-sm p-4 rounded-2xl border border-border flex flex-col items-center gap-2 shadow-sm">
                          <div className="text-primary">{feature.icon}</div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : isAnalyzing ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    <div className="bg-card/80 backdrop-blur-sm p-8 rounded-[2rem] border border-border shadow-sm space-y-8">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-xl bg-muted" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-6 w-1/3 rounded-lg bg-muted" />
                          <Skeleton className="h-4 w-full rounded-full bg-muted" />
                        </div>
                      </div>
                      <Separator className="bg-border/50" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-1/2 rounded-lg bg-muted" />
                          <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
                        </div>
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-1/2 rounded-lg bg-muted" />
                          <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Database className="w-6 h-6 text-white" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-sm">
                            <img 
                              src="https://picsum.photos/seed/ai-chip/32/32" 
                              alt="AI Icon" 
                              className="w-4 h-4 rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-foreground tracking-tight">Mining Results</h2>
                          <p className="text-sm text-muted-foreground font-medium">Deep analysis generated by Gemini AI</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-border bg-card/50 backdrop-blur-sm" onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}>
                          <Copy className="w-4 h-4 mr-2" /> Copy JSON
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 font-bold shadow-lg shadow-primary/20">
                          <Download className="w-4 h-4 mr-2" /> Export Report
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <Card className="md:col-span-1 border-none shadow-sm bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden group">
                        <div className="aspect-[3/4] relative overflow-hidden">
                          <img 
                            src={`https://picsum.photos/seed/${analysis?.summary.substring(0, 10)}/400/600`} 
                            alt="Paper Preview" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6">
                            <p className="text-white text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Document Preview</p>
                            <p className="text-white text-xs font-bold truncate">{file?.name || 'Research Paper'}</p>
                          </div>
                        </div>
                      </Card>

                      <div className="md:col-span-3">
                        <Tabs defaultValue="mining" className="w-full">
                          <TabsList className="flex w-full bg-muted/50 p-1.5 rounded-2xl h-14 mb-8 overflow-x-auto no-scrollbar backdrop-blur-sm">
                            {[
                              { value: 'mining', label: 'AI Mining', icon: <Database className="w-4 h-4" /> },
                              { value: 'method', label: 'Methodology', icon: <Microscope className="w-4 h-4" /> },
                              { value: 'findings', label: 'Findings', icon: <BarChart3 className="w-4 h-4" /> },
                              { value: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" /> },
                            ].map((tab) => (
                              <TabsTrigger 
                                key={tab.value}
                                value={tab.value} 
                                className="flex-1 min-w-[120px] rounded-xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                              >
                                {tab.icon}
                                <span>{tab.label}</span>
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          <div className="min-h-[400px]">
                            <TabsContent value="mining" className="mt-0 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                  { title: 'Models', items: analysis?.dataMining.modelsUsed, icon: <Cpu className="w-4 h-4 text-blue-500" />, bg: 'bg-blue-500/10' },
                                  { title: 'Datasets', items: analysis?.dataMining.datasets, icon: <Layers className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-500/10' },
                                  { title: 'Metrics', items: analysis?.dataMining.metrics, icon: <BarChart3 className="w-4 h-4 text-pink-500" />, bg: 'bg-pink-500/10' },
                                ].map((box, i) => (
                                  <Card key={i} className="border-none shadow-sm bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                                    <CardHeader className={`${box.bg} py-3 px-4`}>
                                      <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                        {box.icon} {box.title}
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                      <div className="flex flex-wrap gap-1.5">
                                        {box.items?.map((item, j) => (
                                          <Badge key={j} variant="secondary" className="bg-muted/50 text-[10px] text-muted-foreground border-border font-bold px-2 py-0">
                                            {item}
                                          </Badge>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                              
                              <Card className="border-none shadow-sm bg-card/80 backdrop-blur-sm rounded-[2rem] overflow-hidden">
                                <CardHeader className="p-8 pb-0">
                                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-amber-500" /> Key Insights
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis?.keyInsights.map((insight, i) => (
                                      <div key={i} className="flex gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                        <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-foreground font-medium leading-relaxed">{insight}</p>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            </TabsContent>
                            {/* ... rest of the content ... */}

                        <TabsContent value="method" className="mt-0">
                          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden paper-texture">
                            <CardHeader className="p-10 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <Microscope className="w-5 h-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-xl font-bold">Research Methodology</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="p-10 pt-4">
                              <p className="text-gray-800 leading-relaxed text-lg font-serif italic">
                                {analysis?.methodology}
                              </p>
                              <div className="mt-10 space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identified Limitations</h4>
                                <div className="flex flex-wrap gap-3">
                                  {analysis?.limitations.map((limit, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                                      <AlertCircle className="w-3 h-3" /> {limit}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="findings" className="mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Key Findings
                              </h3>
                              <div className="space-y-4">
                                {analysis?.keyFindings.map((finding, i) => (
                                  <div key={i} className="flex gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-600 flex-shrink-0">
                                      {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{finding}</p>
                                  </div>
                                ))}
                              </div>
                            </Card>
                            
                            <Card className="border-none shadow-sm bg-white rounded-[2rem] p-8">
                              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-red-600" /> Problem Statements
                              </h3>
                              <div className="space-y-4">
                                {analysis?.problemStatements.map((problem, i) => (
                                  <div key={i} className="flex gap-4 p-4 bg-red-50/30 rounded-2xl border border-red-50">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-[10px] font-bold text-red-600 flex-shrink-0">
                                      {i + 1}
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed">{problem}</p>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="summary" className="mt-0">
                          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden paper-texture">
                            <CardHeader className="p-10 pb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-50 p-2 rounded-lg">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-xl font-bold">Executive Summary</CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="p-10 pt-4">
                              <p className="text-gray-800 leading-relaxed text-xl font-serif italic">
                                "{analysis?.summary}"
                              </p>
                              <div className="mt-12 p-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-[2rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-10">
                                  <Sparkles className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                  <h4 className="font-bold flex items-center gap-2">
                                    <ArrowRight className="w-5 h-5" /> Future Research Paths
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {analysis?.futureDirections.map((dir, i) => (
                                      <div key={i} className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 text-sm font-medium">
                                        {dir}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>

        {/* Footer */}
        <footer className="py-12 border-t border-gray-100 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-foreground">Data mine AI</span>
              </div>
              <div className="flex items-center gap-8">
                <a href="#" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Documentation</a>
                <a href="#" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Privacy</a>
                <a href="#" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">API</a>
              </div>
              <p className="text-[10px] text-gray-300 font-mono uppercase tracking-[0.2em]">
                &copy; 2024 Research Intelligence Lab
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
