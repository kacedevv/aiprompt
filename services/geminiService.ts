import { GoogleGenAI } from "@google/genai";

// 🔑 Lấy API key từ Vercel Environment Variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BFL_API_KEY = process.env.BFL_API_KEY; // FLUX image generation

// ❗Kiểm tra API keys
if (!GEMINI_API_KEY) {
  throw new Error("❌ Missing GEMINI_API_KEY in Vercel Environment Variables.");
}
if (!BFL_API_KEY) {
  console.warn("⚠️ Missing BFL_API_KEY. Image generation will not work.");
}

// Gemini client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * GENERIC FLUX API HANDLER
 * Using BFL.ai endpoint for Flux Pro.
 */
async function callFluxApi(
  prompt: string,
  imageBase64?: string,
  aspectRatio?: string
): Promise<string> {

  if (!BFL_API_KEY) {
    throw new Error("Missing BFL_API_KEY in Vercel Environment Variables.");
  }

  const ENDPOINT = "https://api.bfl.ml/v1/flux-pro-1.1-ultra";

  try {
    const payload: any = {
      prompt,
      aspect_ratio: aspectRatio || "1:1",
      output_format: "png",
      safety_tolerance: 2
    };

    if (imageBase64) {
      payload.image_prompt = imageBase64;
      payload.strength = 0.75;
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": BFL_API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Flux API Error: ${err.detail || response.statusText}`);
    }

    const data = await response.json();
    return data.result?.sample || data.output || "";
  } catch (error) {
    console.error("Flux API Call Failed:", error);
    throw new Error("Flux Image Generation Service Unavailable.");
  }
}

/**
 * Edit image with Flux
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string> => {
  return await callFluxApi(`Edit this image: ${prompt}`, base64Image);
};

/**
 * Meme Generator
 */
export const generateMeme = async (
  prompt: string,
  style: string,
  base64Image?: string
): Promise<string> => {
  const finalPrompt = `A funny meme in ${style} style. Caption: "${prompt}". Viral, high quality.`;
  return await callFluxApi(finalPrompt, base64Image);
};

/**
 * Notion-style Personal Profile generator
 */
export const generateNotionProfile = async (userInfo: string): Promise<string> => {
  try {
    const prompt = `
      Create a single-file HTML (Tailwind CDN) for a Notion-style Personal Profile Page.

      User Information:
      ${userInfo}

      Requirements:
      - Inter font
      - Cover image (unsplash placeholder)
      - Emoji profile icon
      - Clean minimalist layout
      - Return ONLY HTML (no markdown)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    let text = response.text || "";
    text = text.replace(/```html/g, "").replace(/```/g, "");
    return text;
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw error;
  }
};

/**
 * Rewrite text in styles
 */
export const rewriteText = async (
  text: string,
  style: string
): Promise<string> => {
  try {
    const prompt = `
      Rewrite the text below in Vietnamese, in the style: ${style}.

      Text:
      "${text}"

      Output only rewritten content.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return response.text || "";
  } catch (error) {
    console.error("Rewrite Error:", error);
    throw error;
  }
};
