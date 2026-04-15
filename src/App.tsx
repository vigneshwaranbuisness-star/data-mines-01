import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileUp, FileText, Brain, Lightbulb, Target, ArrowRight, 
  Loader2, CheckCircle2, AlertCircle, Copy, History, 
  Trash2, BookOpen, Download, Share2, ExternalLink,
  ChevronRight, Sparkles, Database, Microscope, Info,
  Layers, Cpu, BarChart3, HelpCircle, Moon, Sun, Video, Quote
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  const [extractedText, setExtractedText] = useState<string>('');
  const [highlightedQuote, setHighlightedQuote] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('mining');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'extracting' | 'analyzing'>('idle');
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const videoOptions = [
    { 
      name: "Global Network", 
      url: "https://cdn.pixabay.com/video/2020/05/25/40134-424930335_large.mp4",
      thumbnail: "https://picsum.photos/seed/network/200/120"
    },
    { 
      name: "Neural AI", 
      url: "https://cdn.pixabay.com/video/2021/04/12/70874-537480562_large.mp4",
      thumbnail: "https://picsum.photos/seed/neural/200/120"
    },
    { 
      name: "Scientific Core", 
      url: "https://cdn.pixabay.com/video/2023/10/20/185731-876174624_large.mp4",
      thumbnail: "https://picsum.photos/seed/science/200/120"
    },
    { 
      name: "Synapse Web", 
      url: "https://cdn.pixabay.com/video/2019/04/14/22845-331163436_large.mp4",
      thumbnail: "https://picsum.photos/seed/synapse/200/120"
    },
    { 
      name: "Cyber Grid", 
      url: "https://cdn.pixabay.com/video/2021/04/12/70871-537480559_large.mp4",
      thumbnail: "https://picsum.photos/seed/grid/200/120"
    },
    { 
      name: "Data Stream", 
      url: "https://cdn.pixabay.com/video/2020/05/25/40132-424930333_large.mp4",
      thumbnail: "https://picsum.photos/seed/stream/200/120"
    },
    { 
      name: "Molecular Lab", 
      url: "https://cdn.pixabay.com/video/2022/07/11/123730-728864703_large.mp4",
      thumbnail: "https://picsum.photos/seed/molecular/200/120"
    }
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
      setExtractedText(text);
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
            key={videoOptions[videoIndex].url}
            autoPlay 
            muted 
            loop 
            playsInline
            className="w-full h-full object-cover opacity-40 dark:opacity-20 transition-opacity duration-1000 scale-105"
          >
            <source src={videoOptions[videoIndex].url} type="video/mp4" />
          </video>
          
          {/* Scanning Line Effect */}
          <div className="scanline-effect" />

          {/* Floating Particles (Simplified) */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + '%', 
                  y: Math.random() * 100 + '%',
                  opacity: Math.random() * 0.4
                }}
                animate={{ 
                  y: [null, (Math.random() * -30 - 20) + '%'],
                  opacity: [null, 0]
                }}
                transition={{ 
                  duration: Math.random() * 15 + 10, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 10
                }}
                className="absolute w-1.5 h-1.5 bg-primary/30 rounded-full blur-[2px]"
              />
            ))}
          </div>

          <div className="video-bg-overlay" />
        </div>
        
        {/* Header */}
        <header className="border-b border-white/10 bg-background/40 backdrop-blur-xl sticky top-0 z-50 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-500/20"
              >
                <Brain className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter leading-none ai-gradient-text uppercase">Data mine AI</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em]">Neural Engine Active</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <div className="hidden md:flex items-center gap-6 mr-6 border-r border-white/10 pr-6">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">System Load</span>
                  <span className="text-xs font-mono font-bold text-primary">12.4 TFLOPS</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mining Depth</span>
                  <span className="text-xs font-mono font-bold text-primary">LAYER_07</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger 
                    render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary btn-3d"
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    }
                  />
                  <PopoverContent className="w-80 p-3 glass-card border-white/20" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Environment Select</p>
                        <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary">3D_CORE</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {videoOptions.map((option, index) => (
                          <button
                            key={option.name}
                            onClick={() => setVideoIndex(index)}
                            className={cn(
                              "relative group/thumb aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300",
                              videoIndex === index 
                                ? "border-primary shadow-[0_0_15px_theme('colors.primary.DEFAULT / 40%')]" 
                                : "border-transparent hover:border-white/30"
                            )}
                          >
                            <img 
                              src={option.thumbnail} 
                              alt={option.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className={cn(
                              "absolute inset-0 flex items-end p-2 transition-opacity duration-300",
                              videoIndex === index ? "bg-primary/20" : "bg-black/40 opacity-0 group-hover/thumb:opacity-100"
                            )}>
                              <span className="text-xs font-bold text-white uppercase tracking-widest truncate">{option.name}</span>
                            </div>
                            {videoIndex === index && (
                              <div className="absolute top-1 right-1">
                                <CheckCircle2 className="w-3 h-3 text-primary fill-background" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Tooltip>
                  <TooltipTrigger 
                    render={
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary btn-3d"
                        onClick={() => setIsDarkMode(!isDarkMode)}
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </Button>
                    }
                  />
                  <TooltipContent>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
                </Tooltip>
              </div>

              <Separator orientation="vertical" className="h-6 hidden sm:block border-white/10" />

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-muted-foreground hover:text-primary hidden md:flex btn-3d"
                onClick={() => setShowHowTo(!showHowTo)}
              >
                <HelpCircle className="w-4 h-4 mr-2" /> How it works
              </Button>
              <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider opacity-80 border-white/10 text-primary">
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
                  <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: '1. Upload PDF', desc: 'Drag and drop your research paper. Our system extracts the raw text directly in your browser.', icon: <FileUp className="w-8 h-8 text-blue-500" /> },
                      { title: '2. AI Data Mining', desc: 'Gemini 1.5 Flash mines the text for models, datasets, methodology, and key insights.', icon: <Database className="w-8 h-8 text-purple-500" /> },
                      { title: '3. Explore Insights', desc: 'Navigate through structured tabs to see summaries, findings, and future research paths.', icon: <Microscope className="w-8 h-8 text-pink-500" /> },
                    ].map((step, i) => (
                      <div key={i} className="bg-background/20 p-6 rounded-2xl border border-white/5 space-y-4 backdrop-blur-md hover:bg-background/30 transition-all group hover:-translate-y-1">
                        <div className="mb-2 bg-white/5 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">{step.icon}</div>
                        <h4 className="text-xl font-black text-foreground uppercase tracking-tight">{step.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed font-medium">{step.desc}</p>
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
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Document Source</h2>
                  {file && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setFile(null)}>
                      <Trash2 className="w-3 h-3 mr-1.5" /> Clear
                    </Button>
                  )}
                </div>
                
                <Card className="border-white/10 shadow-sm overflow-hidden glass-card holographic-border">
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
                            <p className="text-sm font-black text-foreground uppercase tracking-tighter truncate max-w-[200px] mb-1">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; PDF
                            </p>
                          </motion.div>
                        ) : (
                          <>
                            <div className="bg-primary/10 p-4 rounded-2xl text-primary transition-colors">
                              <FileUp className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-black text-foreground uppercase tracking-tighter">Neural Interface Dropzone</p>
                              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">PDF_FORMAT_ONLY</p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>

                    {isAnalyzing && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <span>{step === 'extracting' ? 'Extracting Text' : 'AI Mining'}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-primary/10" />
                      </div>
                    )}

                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20 btn-3d"
                      disabled={!file || isAnalyzing}
                      onClick={handleAnalyze}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                          {step === 'extracting' ? 'EXTRACTING_TEXT...' : 'MINING_DATA...'}
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" /> Initialize Mining
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {/* History Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
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
                                <p className="text-base font-bold text-foreground truncate pr-4">{item.fileName}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{item.date}</p>
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
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-full mb-8 relative z-10 holographic-border">
                      <Database className="w-12 h-12 text-primary" />
                      <div className="absolute -top-2 -right-2 bg-purple-500 p-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-3 relative z-10 uppercase tracking-tighter">AI Extraction Portal</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed relative z-10 font-medium">
                      Deploying neural mining clusters to extract deep technical metadata, methodology frameworks, and dataset architectures.
                    </p>
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl relative z-10">
                      {[
                        { icon: <Cpu className="w-4 h-4" />, label: 'Models' },
                        { icon: <Layers className="w-4 h-4" />, label: 'Datasets' },
                        { icon: <BarChart3 className="w-4 h-4" />, label: 'Metrics' },
                        { icon: <Microscope className="w-4 h-4" />, label: 'Methods' },
                      ].map((feature, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -5, scale: 1.05 }}
                          className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2"
                        >
                          <div className="text-primary">{feature.icon}</div>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{feature.label}</span>
                        </motion.div>
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
                          <motion.div 
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 5, repeat: Infinity }}
                            className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg shadow-blue-500/20 holographic-border"
                          >
                            <Database className="w-6 h-6 text-white" />
                          </motion.div>
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
                          <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Mining Sequence Complete</h2>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.3em] mt-2">Neural Analysis Synchronized & Validated</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl border-white/10 glass-card btn-3d" onClick={() => copyToClipboard(JSON.stringify(analysis, null, 2))}>
                          <Copy className="w-4 h-4 mr-2" /> Copy JSON
                        </Button>
                        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-5 font-bold shadow-lg shadow-primary/20 btn-3d">
                          <Download className="w-4 h-4 mr-2" /> Export Intelligence
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-10">
                      {/* Analysis Header & Preview Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <Card className="lg:col-span-3 border-none shadow-xl glass-card rounded-[2.5rem] overflow-hidden group holographic-border sticky top-24">
                          <div className="aspect-[3/4] relative overflow-hidden">
                            <img 
                              src={`https://picsum.photos/seed/${analysis?.summary.substring(0, 10)}/600/800`} 
                              alt="Paper Preview" 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest border-none">Verified Source</Badge>
                              </div>
                              <p className="text-white text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Document Identity</p>
                              <p className="text-white text-base font-black truncate tracking-tight">{file?.name || 'Research Paper'}</p>
                            </div>
                          </div>
                        </Card>

                        <div className="lg:col-span-9 space-y-8">
                          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="flex w-full bg-muted/30 p-2 rounded-[2rem] h-16 mb-10 overflow-x-auto no-scrollbar backdrop-blur-md border border-white/5 shadow-inner">
                              {[
                                { value: 'mining', label: 'Neural Mining', icon: <Database className="w-5 h-5" /> },
                                { value: 'method', label: 'Methodology', icon: <Microscope className="w-5 h-5" /> },
                                { value: 'findings', label: 'Key Findings', icon: <BarChart3 className="w-5 h-5" /> },
                                { value: 'summary', label: 'Executive Summary', icon: <FileText className="w-5 h-5" /> },
                                { value: 'source', label: 'Source Text', icon: <BookOpen className="w-5 h-5" /> },
                              ].map((tab) => (
                                <TabsTrigger 
                                  key={tab.value}
                                  value={tab.value} 
                                  className="flex-1 min-w-[140px] rounded-2xl data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md transition-all font-black text-sm uppercase tracking-widest flex items-center gap-3 btn-3d"
                                >
                                  {tab.icon}
                                  <span>{tab.label}</span>
                                </TabsTrigger>
                              ))}
                            </TabsList>

                            <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                              <TabsContent value="mining" className="mt-0 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {[
                                    { title: 'AI Models', items: analysis?.dataMining.modelsUsed, icon: <Cpu className="w-6 h-6 text-blue-600" />, bg: 'bg-blue-50', desc: 'Neural architectures utilized' },
                                    { title: 'Database Sources', items: analysis?.dataMining.datasets, icon: <Layers className="w-6 h-6 text-purple-600" />, bg: 'bg-purple-50', desc: 'Training & validation sets' },
                                    { title: 'Performance Metrics', items: analysis?.dataMining.metrics, icon: <BarChart3 className="w-6 h-6 text-pink-600" />, bg: 'bg-pink-50', desc: 'Statistical benchmarks' },
                                  ].map((box, i) => (
                                    <Card key={i} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group/box hover:-translate-y-2 transition-all duration-500">
                                      <CardHeader className={`${box.bg} py-6 px-8 border-b border-gray-100`}>
                                        <div className="flex items-center gap-4">
                                          <div className="p-2.5 bg-white rounded-xl shadow-sm">{box.icon}</div>
                                          <div>
                                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">
                                              {box.title}
                                            </CardTitle>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{box.desc}</p>
                                          </div>
                                        </div>
                                      </CardHeader>
                                      <CardContent className="p-8">
                                        <div className="flex flex-wrap gap-3">
                                          {box.items?.map((item, j) => (
                                            <Badge key={j} variant="secondary" className="bg-gray-50 hover:bg-gray-100 text-sm text-gray-900 border-gray-200 font-bold px-5 py-2 rounded-xl transition-all">
                                              {item}
                                            </Badge>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                                
                                <Card className="border-none shadow-lg glass-card rounded-[3rem] overflow-hidden">
                                  <CardHeader className="p-12 pb-8 flex flex-row items-center justify-between">
                                    <CardTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-4">
                                      <div className="p-3 bg-amber-500/20 rounded-2xl">
                                        <Lightbulb className="w-8 h-8 text-amber-500" />
                                      </div>
                                      Key Intelligence Insights
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-12 pt-0">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {analysis?.keyInsights.map((insight, i) => (
                                        <div 
                                          key={i} 
                                          className="flex flex-col gap-5 p-8 bg-amber-500/5 rounded-[2rem] border border-amber-500/10 group/insight cursor-pointer hover:bg-amber-500/10 transition-all hover:-translate-y-2 shadow-sm"
                                          onClick={() => {
                                            if (analysis?.quotes.insights[i]) {
                                              setHighlightedQuote(analysis.quotes.insights[i]);
                                              setActiveTab('source');
                                              toast.info('Jumping to source text...');
                                            }
                                          }}
                                        >
                                          <div className="flex gap-5">
                                            <div className="mt-1.5 flex-shrink-0">
                                              <CheckCircle2 className="w-6 h-6 text-amber-500" />
                                            </div>
                                            <p className="text-xl text-foreground font-medium leading-relaxed tracking-tight">{insight}</p>
                                          </div>
                                          <div className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-widest opacity-0 group-hover/insight:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                            <Target className="w-5 h-5" /> View Source Reference
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            {/* ... rest of the content ... */}

                        <TabsContent value="method" className="mt-0">
                          <Card className="border-none paper-texture rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-12 pb-6">
                              <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                                  <Microscope className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <span className="section-label">Procedural Analysis & Framework</span>
                                  <CardTitle className="text-3xl font-black uppercase tracking-tight text-gray-900">Research Methodology</CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-12 pt-0 space-y-12">
                              <div className="scholarly-border pl-10 py-4 bg-gray-50/50 rounded-r-[2rem]">
                                <p className="scholarly-text text-3xl">
                                  {analysis?.methodology}
                                </p>
                              </div>
                              
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pt-10 border-t border-gray-100">
                                <div className="space-y-6 flex-1">
                                  <span className="section-label">Identified Constraints</span>
                                  <div className="flex flex-wrap gap-4">
                                    {analysis?.limitations.map((limit, i) => (
                                      <div key={i} className="flex items-center gap-3 px-6 py-3 bg-red-50 text-red-700 rounded-2xl text-base font-black border border-red-100 shadow-sm">
                                        <AlertCircle className="w-5 h-5" /> {limit}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <Button 
                                  variant="outline" 
                                  size="lg" 
                                  className="rounded-2xl border-blue-200 bg-white text-blue-700 hover:bg-blue-50 font-black uppercase tracking-widest px-10 h-16 shadow-xl hover:shadow-2xl transition-all"
                                  onClick={() => {
                                    if (analysis?.quotes.methodology) {
                                      setHighlightedQuote(analysis.quotes.methodology);
                                      setActiveTab('source');
                                      toast.info('Jumping to methodology in source...');
                                    }
                                  }}
                                >
                                  <Target className="w-6 h-6 mr-3" /> View Source
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="findings" className="mt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Card className="border-none shadow-2xl bg-white rounded-[3.5rem] p-12 space-y-10">
                              <div className="flex items-center gap-5">
                                <div className="p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200">
                                  <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <span className="section-label">Validated Discoveries</span>
                                  <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900">Key Findings</h3>
                                </div>
                              </div>
                              <div className="space-y-8">
                                {analysis?.keyFindings.map((finding, i) => (
                                  <div 
                                    key={i} 
                                    className="flex flex-col gap-6 p-8 bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100 group/finding cursor-pointer hover:bg-emerald-50 transition-all hover:-translate-y-2 shadow-sm"
                                    onClick={() => {
                                      if (analysis?.quotes.findings[i]) {
                                        setHighlightedQuote(analysis.quotes.findings[i]);
                                        setActiveTab('source');
                                        toast.info('Jumping to finding in source...');
                                      }
                                    }}
                                  >
                                    <div className="flex gap-6">
                                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-md">
                                        {i + 1}
                                      </div>
                                      <p className="text-xl text-gray-900 font-bold leading-relaxed tracking-tight">{finding}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-black text-emerald-600 uppercase tracking-[0.2em] opacity-0 group-hover/finding:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 ml-18">
                                      <Target className="w-5 h-5" /> View Source Reference
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </Card>
                            
                            <Card className="border-none shadow-2xl bg-white rounded-[3.5rem] p-12 space-y-10">
                              <div className="flex items-center gap-5">
                                <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-200">
                                  <Target className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <span className="section-label">Identified Challenges</span>
                                  <h3 className="text-3xl font-black uppercase tracking-tight text-gray-900">Critical Problems</h3>
                                </div>
                              </div>
                              <div className="space-y-8">
                                {analysis?.problemStatements.map((problem, i) => (
                                  <div key={i} className="flex gap-6 p-8 bg-red-50/30 rounded-[2.5rem] border border-red-100 hover:bg-red-50 transition-all shadow-sm">
                                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-md">
                                      {i + 1}
                                    </div>
                                    <p className="text-xl text-gray-900 font-bold leading-relaxed tracking-tight">{problem}</p>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="summary" className="mt-0">
                          <Card className="border-none paper-texture rounded-[3.5rem] overflow-hidden">
                            <CardHeader className="p-12 pb-6">
                              <div className="flex items-center gap-5">
                                <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200">
                                  <FileText className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <span className="section-label">High-Level Intelligence Overview</span>
                                  <CardTitle className="text-3xl font-black uppercase tracking-tight text-gray-900">Executive Summary</CardTitle>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-12 pt-0 space-y-16">
                              <div className="relative p-10 bg-gray-50/50 rounded-[2.5rem] border border-gray-100">
                                <Quote className="absolute -top-6 -left-6 w-16 h-16 text-indigo-100 -z-10" />
                                <p className="scholarly-text text-4xl leading-tight tracking-tight">
                                  {analysis?.summary}
                                </p>
                              </div>

                              <div className="p-12 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-20 opacity-10">
                                  <Sparkles className="w-64 h-64" />
                                </div>
                                <div className="relative z-10 space-y-10">
                                  <div className="flex items-center gap-5">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                      <ArrowRight className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-2xl font-black uppercase tracking-[0.2em]">Future Research Trajectories</h4>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {analysis?.futureDirections.map((dir, i) => (
                                      <div key={i} className="bg-white/10 backdrop-blur-xl p-8 rounded-2xl border border-white/20 text-lg font-bold tracking-tight hover:bg-white/20 transition-all cursor-default shadow-sm">
                                        {dir}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="source" className="mt-0">
                          <Card className="border-none paper-texture rounded-[3.5rem] overflow-hidden h-[800px] flex flex-col">
                            <CardHeader className="p-12 border-b border-gray-100 flex flex-row items-center justify-between shrink-0 bg-white/50 backdrop-blur-md">
                              <div className="flex items-center gap-5">
                                <div className="bg-purple-600 p-4 rounded-2xl shadow-lg shadow-purple-200">
                                  <BookOpen className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                  <span className="section-label">Verbatim Content from PDF</span>
                                  <CardTitle className="text-3xl font-black uppercase tracking-tight text-gray-900">Extracted Source Text</CardTitle>
                                </div>
                              </div>
                              {highlightedQuote && (
                                <Button 
                                  variant="ghost" 
                                  size="lg" 
                                  className="text-sm font-black text-purple-600 hover:bg-purple-50 uppercase tracking-widest px-8 h-14 rounded-2xl"
                                  onClick={() => setHighlightedQuote(null)}
                                >
                                  <Trash2 className="w-5 h-5 mr-3" /> Clear Highlight
                                </Button>
                              )}
                            </CardHeader>
                            <CardContent className="p-0 flex-1 overflow-hidden">
                              <ScrollArea className="h-full p-16">
                                <div className="max-w-4xl mx-auto">
                                  <div className="scholarly-text text-3xl leading-[2] tracking-tight">
                                    {highlightedQuote ? (
                                      extractedText.split(highlightedQuote).map((part, i, arr) => (
                                        <React.Fragment key={i}>
                                          {part}
                                          {i < arr.length - 1 && (
                                            <motion.mark 
                                              initial={{ backgroundColor: 'rgba(234, 179, 8, 0)' }}
                                              animate={{ backgroundColor: 'rgba(234, 179, 8, 0.3)' }}
                                              className="rounded px-1 border-b-2 border-amber-500 font-bold text-foreground"
                                            >
                                              {highlightedQuote}
                                            </motion.mark>
                                          )}
                                        </React.Fragment>
                                      ))
                                    ) : (
                                      extractedText
                                    )}
                                  </div>
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </div>
                    </Tabs>
                  </div>
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
                <a href="#" className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">Documentation</a>
                <a href="#" className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">Privacy</a>
                <a href="#" className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors">API</a>
              </div>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-[0.2em]">
                &copy; 2024 Research Intelligence Lab
              </p>
            </div>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}
