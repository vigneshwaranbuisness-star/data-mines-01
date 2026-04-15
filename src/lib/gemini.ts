import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnalysisResult {
  summary: string;
  keyInsights: string[];
  problemStatements: string[];
  futureDirections: string[];
}

export async function analyzeResearchPaper(text: string): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Analyze the following research paper text and provide a structured analysis in JSON format.
            
            Text:
            ${text.substring(0, 30000)} // Truncate to avoid token limits for a prototype
            
            JSON Schema:
            {
              "summary": "A concise summary of the paper",
              "keyInsights": ["Insight 1", "Insight 2", ...],
              "problemStatements": ["Problem 1", "Problem 2", ...],
              "futureDirections": ["Direction 1", "Direction 2", ...]
            }`
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
          keyInsights: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          problemStatements: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          futureDirections: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["summary", "keyInsights", "problemStatements", "futureDirections"]
      }
    }
  });

  const resultText = response.text;
  if (!resultText) throw new Error("Failed to generate analysis");
  
  return JSON.parse(resultText) as AnalysisResult;
}
