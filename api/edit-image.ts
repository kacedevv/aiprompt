import type { VercelRequest, VercelResponse } from "@vercel/node";
import { editImageWithGemini } from "../services/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { base64Image, prompt, mimeType } = body;

    if (!base64Image || !prompt) {
      return res.status(400).json({ error: "Thiếu base64Image hoặc prompt" });
    }

    const output = await editImageWithGemini(
      base64Image,
      prompt,
      mimeType || "image/png"
    );

    return res.status(200).json({ image: output });
  } catch (err: any) {
    console.error("API edit-image error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
