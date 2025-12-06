// api/meme-gen.ts
// Serverless function cho Vercel (Node runtime)
// Nhận: { prompt, caption, style, imageBase64 }
// Trả: { imageBase64 } (hoặc cả raw response nếu bạn muốn)

export const config = {
  runtime: "nodejs",
};

type MemeGenRequestBody = {
  prompt?: string;
  caption?: string;
  style?: string;
  imageBase64: string;
};

export default async function handler(req: any, res: any) {
  // CORS đơn giản cho frontend Vite
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const BFL_API_KEY = process.env.BFL_API_KEY;

  if (!BFL_API_KEY) {
    return res.status(500).json({
      error: "Missing BFL_API_KEY in Vercel Environment Variables",
    });
  }

  try {
    const body: MemeGenRequestBody =
      typeof req.body === "object" && req.body !== null
        ? req.body
        : await new Promise((resolve, reject) => {
            let data = "";
            req.on("data", (chunk: any) => (data += chunk));
            req.on("end", () => {
              try {
                resolve(JSON.parse(data || "{}"));
              } catch (e) {
                reject(e);
              }
            });
            req.on("error", reject);
          });

    const { prompt, caption, style, imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // ⚠️ Endpoint này chỉ là ví dụ.
    // Hãy chỉnh lại cho đúng theo docs của BFL / Flux bạn đang dùng.
    const apiUrl = "https://api.bfl.ai/v1/image/generate";

    const payload = {
      prompt: prompt || caption || "meme generation",
      caption,
      style,
      image: imageBase64,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BFL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({
        error: "BFL API Error",
        detail: text,
      });
    }

    const result = await response.json();

    // Giả sử BFL trả về imageBase64, nếu structure khác bạn chỉnh lại cho đúng
    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("Meme Gen Error:", err);
    return res.status(500).json({
      error: "Generation failed",
      detail: err?.message || String(err),
    });
  }
}
