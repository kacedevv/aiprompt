// api/photo-editor.ts
// Serverless function cho Vercel (Node runtime)
// Mode: edit / upscale / enhance tùy bạn dùng trong frontend

export const config = {
  runtime: "nodejs",
};

type PhotoEditRequestBody = {
  prompt?: string;
  mode?: "edit" | "upscale" | "enhance" | string;
  imageBase64: string;
};

export default async function handler(req: any, res: any) {
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
    const body: PhotoEditRequestBody =
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

    const { prompt, mode = "edit", imageBase64 } = body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    // ⚠️ Endpoint ví dụ, chỉnh theo docs BFL bạn dùng
    const apiUrl =
      mode === "upscale"
        ? "https://api.bfl.ai/v1/image/upscale"
        : "https://api.bfl.ai/v1/image/edit";

    const payload = {
      prompt: prompt || "photo editing",
      image: imageBase64,
      mode,
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

    return res.status(200).json({
      success: true,
      result,
    });
  } catch (err: any) {
    console.error("Photo Editor Error:", err);
    return res.status(500).json({
      error: "Photo edit failed",
      detail: err?.message || String(err),
    });
  }
}
