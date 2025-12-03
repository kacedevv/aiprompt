import { GoogleGenAI } from "@google/genai";

// ✅ Đặt biến môi trường này trong Vercel: GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Thiếu GEMINI_API_KEY. Vào Vercel → Project Settings → Environment Variables để cấu hình.");
}

const ai = new GoogleGenAI({ apiKey });

/**
 * Xác định lỗi vượt quota API Gemini
 */
const isQuotaError = (error: any) => {
  const msg = error?.message || error?.toString() || "";
  return (
    error?.status === "RESOURCE_EXHAUSTED" ||
    msg.includes("Quota exceeded") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
};

/**
 * Edit ảnh bằng Gemini 2.5 Flash Image
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Không nhận được ảnh từ Gemini.");
  } catch (error: any) {
    console.error("Gemini API Error (editImage):", error);

    if (isQuotaError(error)) {
      throw new Error("Hết lượt sử dụng miễn phí AI tạo ảnh. Vui lòng thử lại sau hoặc nâng cấp gói.");
    }

    throw error;
  }
};

/**
 * Tạo meme từ caption + phong cách + ảnh nền (tuỳ chọn)
 */
export const generateMeme = async (
  prompt: string,
  style: string,
  base64Image?: string
): Promise<string> => {
  try {
    const finalPrompt = `Create a meme image. Caption: "${prompt}". Style: ${style}. Ensure the text is legible and funny.`;

    const parts: any[] = [{ text: finalPrompt }];

    if (base64Image) {
      const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      parts.unshift({ inlineData: { data: cleanBase64, mimeType: "image/png" } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
    });

    const contentParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of contentParts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Không tạo được meme.");
  } catch (error: any) {
    console.error("Meme Gen Error:", error);

    if (isQuotaError(error)) {
      throw new Error("Hết lượt tạo meme bằng AI (ảnh). Bạn có thể dùng lại sau hoặc nâng cấp.");
    }

    throw error;
  }
};

/**
 * Tạo trang Notion Profile cá nhân từ thông tin người dùng
 */
export const generateNotionProfile = async (userInfo: string): Promise<string> => {
  try {
    const prompt = `
Create a single-file HTML (with embedded Tailwind CSS via CDN) for a Personal Profile Page in the style of "Notion" (Minimalist, emoji icons, clean typography, whitespace).

User Information:
${userInfo}

Requirements:
- Use a Notion-like font stack (Inter, sans-serif).
- Include a cover image placeholder (use unsplash source url).
- Include an emoji icon for the profile picture/icon.
- Layout: Cover -> Icon -> Title (Name) -> Properties (Tags) -> Content sections.
- Return ONLY the raw HTML code, no markdown backticks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const html = response.text || "";
    return html.replace(/```html|```/g, "");
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw new Error("Không tạo được profile Notion. Vui lòng thử lại.");
  }
};

/**
 * Viết lại đoạn văn theo phong cách nổi tiếng
 */
export const rewriteText = async (text: string, style: string): Promise<string> => {
  try {
    const prompt = `
Rewrite the following text in Vietnamese, mimicking the style of: ${style}.

Original Text:
"${text}"

Style Nuances:
- Sơn Tùng M-TP: Abstract, sky, dreams, slightly arrogant but poetic, use words like "bầu trời", "cơn mưa".
- Đen Vâu: Metaphorical, humble, rap lyrics flow, observational, daily life struggles, nature.
- Thơ Xuân Quỳnh: Feminine, intense love, waves ("sóng"), traditional poetic structure, emotional.
- Academic (Học thuật): Formal, complex vocabulary, structured, objective.
- Romantic (Lãng mạn): Cheesy, emotional, flowery adjectives.

Output only the rewritten text.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Không thể viết lại văn bản.";
  } catch (error) {
    console.error("Rewrite Error:", error);
    throw new Error("Không thể viết lại văn bản. Vui lòng thử lại.");
  }
};
