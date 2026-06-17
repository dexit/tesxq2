import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Gemini
const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Email Dispatch Share Endpoint
app.post("/api/share/email", async (req, res) => {
  try {
    const { certificateId, email, clientName, message, refNumber } = req.body;
    
    if (!certificateId || !email) {
      return res.status(400).json({ error: "Missing certificateId or email" });
    }

    console.log(`[Email Dispatch] Sending CP12 certificate notification to ${email}...`);
    
    const subject = `Gas Safety Record Issued: ${refNumber || 'CP12 Certificate'}`;
    const directLink = `http://localhost:3000/?certId=${certificateId}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; border-top: 6px solid #2563eb;">
        <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.025em;">Boiler<span style="color: #2563eb;">Flow</span> Official Dispatch</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Hello ${clientName || 'Valued Customer'},</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your certified Gas Safety Inspection record has been issued by our Gas Safe Registered Field Engineer. Please review the details below:</p>
        
        <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="color: #64748b; padding-bottom: 8px; font-weight: bold; width: 35%;">Certificate Ref:</td>
              <td style="color: #0f172a; padding-bottom: 8px; font-weight: bold;">${refNumber || 'CP12 Security Copy'}</td>
            </tr>
            <tr>
              <td style="color: #64748b; padding-bottom: 8px; font-weight: bold;">Issuer Engineer:</td>
              <td style="color: #0f172a; padding-bottom: 8px;">Alex Smith (Gas Safe #821039)</td>
            </tr>
            <tr>
              <td style="color: #64748b; font-weight: bold; vertical-align: top;">Notes / Remarks:</td>
              <td style="color: #475569; font-style: italic;">"${message || 'Annual safety examinations passed safely.'}"</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 30px;">To view the full digital safety evaluation, verify safety devices, or download your signed high-resolution CP12 PDF, launch the portal button below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${directLink}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 10px -1px rgba(37,99,235,0.2);">Launch Customer Portal</a>
        </div>
        
        <p style="font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 24px; margin-top: 30px;">This is a secure system-generated notification from BoilerFlow on behalf of your boiler installation agent. If you did not expect this document, please contact support.</p>
      </div>
    `;

    return res.json({ 
      success: true, 
      subject,
      recipient: email,
      html: htmlContent,
      directLink
    });
  } catch (error: any) {
    console.error("Email share error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Gemini Proxy
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { prompt, model = "gemini-3.5-flash", config } = req.body;
    const response = await genAI.models.generateContent({
      model,
      contents: prompt,
      config
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Workspace Proxy Placeholder (to be implemented with real logic)
app.post("/api/workspace/calendar/event", async (req, res) => {
  // Logic for Google Calendar integration
  res.status(501).json({ error: "Not implemented yet" });
});

// Vite middleware setup
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
