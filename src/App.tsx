import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileUp, FileText, Brain, Lightbulb, Target, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { extractTextFromPDF } from '@/lib/pdf';
import { analyzeResearchPaper, AnalysisResult } from '@/lib/gemini';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'idle' | 'extracting' | 'analyzing'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setAnalysis(null);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setStep('extracting');

    try {
      // Step 1: Extract Text
      const text = await extractTextFromPDF(file);
      
      setStep('analyzing');
      
      // Step 2: Analyze with Gemini
      const result = await analyzeResearchPaper(text);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setStep('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="border-bottom border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ScholarScan AI</h1>
          </div>
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider opacity-60">
            v1.0.0 Prototype
          </Badge>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload & Controls */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Upload Paper</CardTitle>
                <CardDescription>Select a research paper in PDF format to begin analysis.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className={`
                    border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center gap-3
                    ${file ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50/50'}
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
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {file ? (
                      <>
                        <div className="bg-blue-100 p-3 rounded-full">
                          <FileText className="w-8 h-8 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-blue-700 truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="bg-gray-100 p-3 rounded-full">
                          <FileUp className="w-8 h-8 text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-500">Click to upload PDF</span>
                      </>
                    )}
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-lg transition-all"
                  disabled={!file || isAnalyzing}
                  onClick={handleAnalyze}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {step === 'extracting' ? 'Extracting Text...' : 'AI Analyzing...'}
                    </>
                  ) : (
                    <>
                      Generate Analysis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">System Architecture</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 text-sm">
                  {[
                    { label: 'Frontend', value: 'React + Tailwind', icon: <FileText className="w-4 h-4" /> },
                    { label: 'Extraction', value: 'PDF.js (Client-side)', icon: <FileUp className="w-4 h-4" /> },
                    { label: 'AI Engine', value: 'Gemini 1.5 Flash', icon: <Brain className="w-4 h-4" /> },
                    { label: 'Processing', value: 'JSON Schema Output', icon: <Target className="w-4 h-4" /> },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3 border-b border-gray-50 last:border-0">
                      <div className="text-blue-500">{item.icon}</div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">{item.label}</p>
                        <p className="font-medium text-gray-700">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!analysis && !isAnalyzing ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-gray-200"
                >
                  <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <Brain className="w-12 h-12 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for Analysis</h3>
                  <p className="text-gray-500 max-w-sm">
                    Upload a research paper to see key insights, summaries, and future research directions.
                  </p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <Skeleton className="h-8 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Skeleton className="h-24 w-full" />
                      <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white p-1 rounded-xl shadow-sm border border-gray-100 h-12">
                      <TabsTrigger value="summary" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Summary</TabsTrigger>
                      <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Insights</TabsTrigger>
                      <TabsTrigger value="problems" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Problems</TabsTrigger>
                      <TabsTrigger value="future" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Future</TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                      <TabsContent value="summary">
                        <Card className="border-none shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-600">
                              <FileText className="w-5 h-5" />
                              Paper Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 leading-relaxed text-lg italic font-serif">
                              "{analysis?.summary}"
                            </p>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="insights">
                        <Card className="border-none shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600">
                              <Lightbulb className="w-5 h-5" />
                              Key Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {analysis?.keyInsights.map((insight, i) => (
                                <li key={i} className="flex gap-3 items-start group">
                                  <div className="mt-1 bg-amber-50 p-1 rounded-md group-hover:bg-amber-100 transition-colors">
                                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                  </div>
                                  <span className="text-gray-700">{insight}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="problems">
                        <Card className="border-none shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                              <Target className="w-5 h-5" />
                              Problem Statements
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {analysis?.problemStatements.map((problem, i) => (
                                <li key={i} className="flex gap-3 items-start group">
                                  <div className="mt-1 bg-red-50 p-1 rounded-md group-hover:bg-red-100 transition-colors">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                  </div>
                                  <span className="text-gray-700">{problem}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="future">
                        <Card className="border-none shadow-sm bg-white">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-emerald-600">
                              <ArrowRight className="w-5 h-5" />
                              Future Research Directions
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-4">
                              {analysis?.futureDirections.map((direction, i) => (
                                <li key={i} className="flex gap-3 items-start group">
                                  <div className="mt-1 bg-emerald-50 p-1 rounded-md group-hover:bg-emerald-100 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <span className="text-gray-700">{direction}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </div>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">
            ScholarScan AI &bull; Built with Gemini 1.5 Flash &bull; 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
