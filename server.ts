import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Gemini API Route
  app.post("/api/analyze", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
      }

      const genAI = new (GoogleGenAI as any)({ apiKey });
      const model = (genAI as any).getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });

      const prompt = `Analyze the following research paper text and provide a deep data mining analysis in JSON format.
            
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
            
            CRITICAL: The "quotes" field MUST contain EXACT, VERBATIM strings from the provided text so they can be located for highlighting.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
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

      const responseText = result.response.text();
      res.json(JSON.parse(responseText));
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
