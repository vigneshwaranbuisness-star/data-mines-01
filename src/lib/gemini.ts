import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze the following research paper text and provide a deep data mining analysis in JSON format.
            
            Text:
            ${text.substring(0, 30000)}
            
            JSON Schema:
            {
              "summary": "A concise summary",
              "keyInsights": ["Insight 1", ...],
              "problemStatements": ["Problem 1", ...],
              "futureDirections": ["Direction 1", ...],
              "methodology": "Brief description of the research methodology",
              "keyFindings": ["Finding 1", ...],
              "limitations": ["Limitation 1", ...],
              "dataMining": {
                "modelsUsed": ["Model A", "Algorithm B", ...],
                "datasets": ["Dataset X", ...],
                "metrics": ["Accuracy", "F1-Score", ...]
              },
              "quotes": {
                "methodology": "A direct, verbatim excerpt from the text that describes the methodology",
                "findings": ["Direct verbatim excerpt for finding 1", ...],
                "insights": ["Direct verbatim excerpt for insight 1", ...]
              }
            }
            
            CRITICAL: The "quotes" field MUST contain EXACT, VERBATIM strings from the provided text so they can be located for highlighting.`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          problemStatements: { type: Type.ARRAY, items: { type: Type.STRING } },
          futureDirections: { type: Type.ARRAY, items: { type: Type.STRING } },
          methodology: { type: Type.STRING },
          keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
          limitations: { type: Type.ARRAY, items: { type: Type.STRING } },
          dataMining: {
            type: Type.OBJECT,
            properties: {
              modelsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
              datasets: { type: Type.ARRAY, items: { type: Type.STRING } },
              metrics: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["modelsUsed", "datasets", "metrics"]
          },
          quotes: {
            type: Type.OBJECT,
            properties: {
              methodology: { type: Type.STRING },
              findings: { type: Type.ARRAY, items: { type: Type.STRING } },
              insights: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["methodology", "findings", "insights"]
          }
        },
        required: ["summary", "keyInsights", "problemStatements", "futureDirections", "methodology", "keyFindings", "limitations", "dataMining", "quotes"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) throw new Error("Failed to generate analysis");
  
  return JSON.parse(resultText) as AnalysisResult;
}
