import { GoogleGenAI } from "@google/genai";

// 🔑 GEMINI (TEXT) – dùng trên frontend qua Vite env
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as
  | string
  | undefined;

// Nếu chưa set thì chỉ warning, không cho app crash
if (!GEMINI_API_KEY) {
  console.warn(
    "⚠️ VITE_GEMINI_API_KEY chưa được cấu hình. Các chức năng dùng Gemini (rewrite, profile) có thể không hoạt động."
  );
}

// Chỉ tạo client nếu có key
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/**
 * 🧩 Helper gọi backend (/api/*)
 * - ĐÃ FIX lỗi "body stream already read" bằng cách chỉ đọc body 1 lần
 */
async function callBackend<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // ❗Chỉ đọc stream 1 lần
  const rawText = await res.text();

  let json: any;
  try {
    json = JSON.parse(rawText);
  } catch {
    json = rawText;
  }

  if (!res.ok) {
    const msg =
      json?.error ||
      json?.detail ||
      rawText ||
      `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

/**
 * 📷 PHOTO EDITOR – dùng BFL qua backend /api/photo-editor
 *   Trả về base64 của ảnh đã edit
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

  const img =
    result.imageBase64 ||
    result.sample ||
    result.output ||
    result.result?.sample ||
    "";

  if (!img) {
    throw new Error("Photo Editor: API không trả về ảnh.");
  }

  return img;
};

/**
 * 😂 MEME GENERATOR – dùng BFL qua backend /api/meme-gen
 *   Trả về base64 của meme
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
    throw new Error("Meme Gen: API không trả về ảnh.");
  }

  return img;
};

/**
 * 🧾 NOTION-STYLE PROFILE – Gemini text
 */
export const generateNotionProfile = async (
  userInfo: string
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "Thiếu VITE_GEMINI_API_KEY nên không tạo được Notion Profile."
    );
  }

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

    // Tùy SDK, bạn đang dùng response.text nên giữ như cũ
    let text = (response as any).text || "";
    text = text.replace(/```html/g, "").replace(/```/g, "");
    return text;
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw error;
  }
};

/**
 * ✍️ REWRITE TEXT – Gemini text
 */
export const rewriteText = async (
  text: string,
  style: string
): Promise<string> => {
  if (!ai) {
    throw new Error(
      "Thiếu VITE_GEMINI_API_KEY nên không dùng được Rewrite Text."
    );
  }

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
