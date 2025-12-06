import { GoogleGenAI } from "@google/genai";

// 🧠 GEMINI cho text (chạy trên frontend)
// Dùng biến Vite: VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as
  | string
  | undefined;

if (!GEMINI_API_KEY) {
  throw new Error(
    "❌ Missing VITE_GEMINI_API_KEY. Hãy set trong .env hoặc Vercel."
  );
}

// Gemini client
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Helper: gọi API backend (meme-gen / photo-editor)
 */
async function callBackend<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    try {
      const err = await res.json();
      throw new Error(err.error || err.detail || `Request failed: ${res.status}`);
    } catch {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
  }

  return res.json();
}

/**
 * 📷 Photo Editor (dùng BFL qua backend /api/photo-editor)
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string> => {
  const data = await callBackend<any>("/api/photo-editor", {
    prompt,
    mode: "edit",
    imageBase64: base64Image,
  });

  const result = data.result ?? data;

  // Cố gắng lấy base64 từ nhiều field khác nhau cho chắc
  const img =
    result.imageBase64 ||
    result.sample ||
    result.output ||
    result.result?.sample ||
    "";

  if (!img) {
    throw new Error("Photo Editor: No image returned from API.");
  }

  return img;
};

/**
 * 😂 Meme Generator (dùng BFL qua backend /api/meme-gen)
 */
export const generateMeme = async (
  prompt: string,
  style: string,
  base64Image?: string
): Promise<string> => {
  const finalPrompt = `A funny meme in ${style} style. Caption: "${prompt}". Viral, high quality.`;

  const data = await callBackend<any>("/api/meme-gen", {
    prompt: finalPrompt,
    caption: prompt,
    style,
    imageBase64: base64Image,
  });

  const result = data.result ?? data;

  const img =
    result.imageBase64 ||
    result.sample ||
    result.output ||
    result.result?.sample ||
    "";

  if (!img) {
    throw new Error("Meme Gen: No image returned from API.");
  }

  return img;
};

/**
 * 🧩 Notion-style Personal Profile generator (Gemini text)
 */
export const generateNotionProfile = async (
  userInfo: string
): Promise<string> => {
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
      contents: prompt,
    });

    // tuỳ phiên bản SDK, bạn đang dùng response.text nên tôi giữ nguyên
    let text = (response as any).text || "";
    text = text.replace(/```html/g, "").replace(/```/g, "");
    return text;
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw error;
  }
};

/**
 * ✍️ Rewrite text in styles (Gemini text)
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
      contents: prompt,
    });

    return (response as any).text || "";
  } catch (error) {
    console.error("Rewrite Error:", error);
    throw error;
  }
};
