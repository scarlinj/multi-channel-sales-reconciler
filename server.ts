import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));

// Lazy init Gemini Client to avoid crash if API key is not present immediately
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please configure it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Reconcile endpoint
app.post("/api/reconcile", async (req, res) => {
  const { sourceName, channel, rawText } = req.body;

  if (!sourceName || !channel || !rawText) {
    return res.status(400).json({ error: "Missing required fields: sourceName, channel, and rawText are required." });
  }

  try {
    const ai = getGeminiClient();

    const prompt = `
      You are a payment onboarding manager's data assistant.
      Your task is to parse a raw sales report or pasted data from the channel "${channel}" (Source Name: "${sourceName}").
      
      Extract all valid transaction rows. Format them strictly according to the specified JSON schema.
      For each transaction, determine:
      1. The transaction date. Format it as YYYY-MM-DD. If only month/day is given, assume the year is 2026. If no date is found, default to '2026-07-01' or a sensible date based on context.
      2. The item or product name. Clean it up (remove raw IDs, redundant system codes, or extra punctuation).
      3. The total amount. Must be an absolute positive number representing the monetary value.
      4. The quantity. Must be a positive integer.
      5. The customer region. Group them into standard geographic regions: "North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", or "Other". If not specified, look for country codes, currency, or clues, otherwise use "Other".
      6. The type of transaction: 'sale' (if a purchase, order, or positive sale) or 'return' (if a refund, return, reversal, or chargeback).

      Do not include summary rows, headers, total lines, or tax lines as individual items. Only extract actual product sales or returns.
      Here is the raw report content:
      
      --- START REPORT CONTENT ---
      ${rawText}
      --- END REPORT CONTENT ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert financial analyst and data parser. Your goal is to output a clean, accurate, and structured JSON array of individual sales transactions from raw channel reports.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD format." },
              item: { type: Type.STRING, description: "Name of the product or item sold or returned." },
              amount: { type: Type.NUMBER, description: "Total price/amount for this line item (must be positive)." },
              quantity: { type: Type.INTEGER, description: "Quantity of the item (must be positive)." },
              region: { type: Type.STRING, description: "Region name: North America, Europe, Asia-Pacific, Latin America, Middle East & Africa, or Other." },
              type: { type: Type.STRING, description: "Must be exactly 'sale' or 'return'." }
            },
            required: ["date", "item", "amount", "quantity", "region", "type"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response received from Gemini.");
    }

    const transactions = JSON.parse(text.trim());

    // Post-process to add unique IDs and source metadata
    const parsedTransactions = transactions.map((t: any, index: number) => ({
      id: `${channel.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${index}`,
      date: t.date || "2026-07-01",
      item: t.item || "Unknown Product",
      amount: Number(t.amount) || 0,
      quantity: Number(t.quantity) || 1,
      region: t.region || "Other",
      source: sourceName,
      type: t.type === "return" ? "return" : "sale"
    }));

    return res.json({
      success: true,
      transactions: parsedTransactions,
      recordCount: parsedTransactions.length
    });

  } catch (error: any) {
    console.error("Reconciliation error:", error);
    return res.status(500).json({
      error: error.message || "Failed to reconcile report data. Please check your inputs and try again."
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!process.env.GEMINI_API_KEY });
});

// Vite server middleware or static assets
async function startServer() {
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
