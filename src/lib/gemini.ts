export interface AnalysisResult {
  summary: string;
  keyInsights: string[];
  problemStatements: string[];
  futureDirections: string[];
  methodology: string;
  keyFindings: string[];
  limitations: string[];
  dataMining: {
    modelsUsed: string[];
    datasets: string[];
    metrics: string[];
  };
  quotes: {
    methodology: string;
    findings: string[];
    insights: string[];
  };
}

export async function analyzeResearchPaper(text: string): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate analysis");
  }

  return await response.json() as AnalysisResult;
}
