import { GoogleGenAI } from "@google/genai";

// 🔑 GEMINI (text)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// 🔑 FLUX (image) – lấy ở: https://api.bfl.ai (Dashboard → API Keys)
const BFL_API_KEY = process.env.BFL_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Thiếu GEMINI_API_KEY. Hãy cấu hình trong Vercel → Settings → Environment Variables.");
}

if (!BFL_API_KEY) {
  throw new Error("Thiếu BFL_API_KEY. Hãy vào https://api.bfl.ai để lấy key và cấu hình trong Vercel.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const BFL_BASE_URL = "https://api.bfl.ai/v1";

/**
 * Helper: đợi ms mili giây
 */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Helper: poll kết quả từ BFL cho tới khi status = "Ready"
 * Trả về: URL ảnh (signed URL, sống ~10 phút)
 */
const pollBflResult = async (pollingUrl: string): Promise<string> => {
  for (let i = 0; i < 40; i++) {
    await sleep(1000);

    const res = await fetch(pollingUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-key": BFL_API_KEY as string,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`BFL polling error (${res.status}): ${text}`);
    }

    const json: any = await res.json();
    const status = json.status;

    if (status === "Ready") {
      const sampleUrl = json.result?.sample;
      if (!sampleUrl) {
        throw new Error("BFL: Không tìm thấy URL ảnh trong kết quả.");
      }
      return sampleUrl;
    }

    if (status === "Error" || status === "Failed") {
      throw new Error("BFL: Tạo ảnh thất bại. " + (json.message || ""));
    }

    // Các trạng thái khác: "Pending", "Running" → tiếp tục loop
  }

  throw new Error("BFL: Hết thời gian chờ kết quả.");
};

/**
 * Helper: tải ảnh từ URL (signed URL của BFL) và convert thành data URL base64
 */
const fetchImageAsDataUrl = async (
  imageUrl: string,
  mimeType: string = "image/png"
): Promise<string> => {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Tải ảnh từ BFL thất bại (${res.status}): ${text}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${mimeType};base64,${base64}`;
};

/* -------------------------------------------------------------------------- */
/*  1. EDIT ẢNH – DÙNG FLUX KONTEKST (THAY CHO GEMINI IMAGE)                  */
/* -------------------------------------------------------------------------- */

/**
 * Edits an image using FLUX.1 Kontext (image editing).
 * ⚠️ Giữ nguyên tên hàm để không phải sửa chỗ khác trong code.
 */
export const editImageWithGemini = async (
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<string> => {
  try {
    // BFL yêu cầu base64 "sạch" (không kèm prefix data:image/...)
    const cleanBase64 = base64Image.replace(
      /^data:image\/(png|jpeg|jpg|webp);base64,/,
      ""
    );

    // 1) Gửi request edit ảnh tới FLUX Kontext
    const submitRes = await fetch(`${BFL_BASE_URL}/flux-kontext-pro`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-key": BFL_API_KEY as string,
      },
      body: JSON.stringify({
        prompt,
        input_image: cleanBase64,
        output_format: "png", // để mình convert về data:image/png
        // có thể thêm: safety_tolerance, seed, aspect_ratio...
      }),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      // 402 = hết credits, 429 = rate limit
      if (submitRes.status === 402) {
        throw new Error(
          "Hết credits FLUX cho việc tạo/đổi ảnh. Vui lòng kiểm tra lại tài khoản BFL."
        );
      }
      if (submitRes.status === 429) {
        throw new Error(
          "FLUX đang bị giới hạn tốc độ (rate limit). Vui lòng thử lại sau ít phút."
        );
      }
      throw new Error(`Gửi request FLUX-Kontext lỗi (${submitRes.status}): ${text}`);
    }

    const submitJson: any = await submitRes.json();
    const pollingUrl = submitJson.polling_url;
    if (!pollingUrl) {
      throw new Error("Không nhận được polling_url từ BFL.");
    }

    // 2) Poll cho tới khi ảnh sẵn sàng
    const imageUrl = await pollBflResult(pollingUrl);

    // 3) Tải ảnh về và convert sang data URL base64
    return await fetchImageAsDataUrl(imageUrl, "image/png");
  } catch (error) {
    console.error("FLUX Edit Image Error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  2. TẠO MEME – DÙNG FLUX TEXT-TO-IMAGE                                     */
/* -------------------------------------------------------------------------- */

/**
 * Generates a Meme using FLUX text-to-image.
 * ⚠️ Giữ nguyên tên hàm để không phải sửa chỗ khác trong code.
 */
export const generateMeme = async (
  prompt: string,
  style: string,
  base64Image?: string
): Promise<string> => {
  try {
    const finalPrompt = `Create a meme image. Caption: "${prompt}". Style: ${style}. Ensure the text is large, bold, and easy to read.`;

    let fullPrompt = finalPrompt;

    // Nếu bạn muốn dùng ảnh gốc làm reference,
    // hiện FLUX text-to-image ở endpoint này không nhận input_image,
    // nên mình chỉ dùng text prompt. Nếu sau này bạn dùng model hỗ trợ img2img,
    // có thể thay đổi ở đây.
    if (base64Image) {
      fullPrompt =
        finalPrompt +
        " Use a layout similar to the provided image (top and bottom text, meme style).";
    }

    // 1) Gửi request tạo ảnh tới FLUX (dùng flux-pro-1.1 cho chất lượng tốt)
    const submitRes = await fetch(`${BFL_BASE_URL}/flux-pro-1.1`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "x-key": BFL_API_KEY as string,
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        width: 1024,
        height: 1024,
        output_format: "png",
      }),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text();
      if (submitRes.status === 402) {
        throw new Error(
          "Hết credits FLUX cho việc tạo ảnh. Vui lòng kiểm tra lại tài khoản BFL."
        );
      }
      if (submitRes.status === 429) {
        throw new Error(
          "FLUX đang bị rate limit. Vui lòng thử lại sau ít phút."
        );
      }
      throw new Error(`Gửi request FLUX-Pro lỗi (${submitRes.status}): ${text}`);
    }

    const submitJson: any = await submitRes.json();
    const pollingUrl = submitJson.polling_url;
    if (!pollingUrl) {
      throw new Error("Không nhận được polling_url từ BFL.");
    }

    // 2) Poll kết quả
    const imageUrl = await pollBflResult(pollingUrl);

    // 3) Convert sang data URL base64 (để frontend dùng giống như Gemini trước đây)
    return await fetchImageAsDataUrl(imageUrl, "image/png");
  } catch (error) {
    console.error("FLUX Meme Gen Error:", error);
    throw error;
  }
};

/* -------------------------------------------------------------------------- */
/*  3. GEMINI – TEXT (GIỮ NGUYÊN)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Generates a Notion-style Personal Profile (HTML code).
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

    let text = (response as any).text || "";
    text = text.replace(/```html/g, "").replace(/```/g, "");
    return text;
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw error;
  }
};

/**
 * Rewrites text in a specific celebrity style.
 */
export const rewriteText = async (text: string, style: string): Promise<string> => {
  try {
    const prompt = `
      Rewrite the following text in the Vietnamese language, mimicking the style of: ${style}.
      
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

    return (response as any).text || "Could not generate text.";
  } catch (error) {
    console.error("Rewrite Error:", error);
    throw error;
  }
};
