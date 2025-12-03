import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateMeme } from "../services/geminiService";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { prompt, style, base64Image } = body;

    if (!prompt || !style) {
      return res.status(400).json({ error: "Thiếu prompt hoặc style" });
    }

    const output = await generateMeme(prompt, style, base64Image);

    return res.status(200).json({ image: output });
  } catch (err: any) {
    console.error("API generate-meme error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
}
