// api/meme-gen.ts
// Serverless function cho Vercel (Node runtime)
// Dùng FLUX 1.1 Pro Ultra của BFL để tạo meme (text + optional image_prompt)

export const config = {
  runtime: "nodejs",
};

type MemeGenRequestBody = {
  prompt?: string;
  caption?: string;
  style?: string;
  imageBase64?: string;
  aspectRatio?: string;
};

function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      if (req.body && typeof req.body === "object") {
        return resolve(req.body);
      }

      let data = "";
      req.on("data", (chunk: any) => (data += chunk));
      req.on("end", () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req: any, res: any) {
  // CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST is allowed" });
  }

  const BFL_API_KEY = process.env.BFL_API_KEY;
  if (!BFL_API_KEY) {
    return res.status(500).json({
      error: "Missing BFL_API_KEY in Vercel Environment Variables",
    });
  }

  try {
    const body: MemeGenRequestBody = await parseBody(req);

    const { prompt, caption, style, imageBase64, aspectRatio } = body;

    if (!prompt && !caption) {
      return res.status(400).json({
        error: "Missing prompt or caption",
      });
    }

    // Build final prompt cho meme
    const finalPrompt =
      prompt ||
      `A funny meme in ${style || "internet"} style. Caption: "${
        caption || ""
      }". Viral, high quality.`;

    // Payload cho BFL Flux Pro 1.1 Ultra
    const payload: any = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio || "1:1",
      output_format: "png",
    };

    // Nếu có ảnh gốc, dùng làm image_prompt (ít nhất BFL nhận param này)
    if (imageBase64) {
      payload.image_prompt = imageBase64;
      payload.strength = 0.75;
    }

    // 1️⃣ SUBMIT REQUEST (async) – trả về id + polling_url
    const submitRes = await fetch("https://api.bfl.ai/v1/flux-pro-1.1-ultra", {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-key": BFL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const submitText = await submitRes.text();
    let submitJson: any;
    try {
      submitJson = JSON.parse(submitText);
    } catch {
      submitJson = null;
    }

    if (!submitRes.ok) {
      return res.status(submitRes.status).json({
        error: "BFL API Error (submit)",
        detail: submitJson || submitText,
      });
    }

    const pollingUrl = submitJson?.polling_url;
    const requestId = submitJson?.id;

    if (!pollingUrl) {
      return res.status(500).json({
        error: "BFL API Error (submit)",
        detail: "Missing polling_url in response",
      });
    }

    // 2️⃣ POLL RESULT đến khi Ready / Error
    const maxTries = 30; // ~15s (30 * 0.5s)
    let resultJson: any = null;

    for (let i = 0; i < maxTries; i++) {
      await sleep(500);

      const pollRes = await fetch(pollingUrl, {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-key": BFL_API_KEY,
        },
      });

      const pollText = await pollRes.text();
      let pollJson: any;
      try {
        pollJson = JSON.parse(pollText);
      } catch {
        pollJson = null;
      }

      if (!pollRes.ok) {
        return res.status(pollRes.status).json({
          error: "BFL API Error (poll)",
          detail: pollJson || pollText,
        });
      }

      const status = pollJson?.status;
      if (status === "Ready") {
        resultJson = pollJson;
        break;
      }

      if (status === "Error" || status === "Failed") {
        return res.status(500).json({
          error: "BFL API Error",
          detail: pollJson,
        });
      }

      // Nếu vẫn Pending/Processing → tiếp tục vòng lặp
    }

    if (!resultJson) {
      return res.status(504).json({
        error: "BFL API Timeout",
        detail: `Request ${requestId || ""} did not finish in time`,
      });
    }

    const sampleUrl = resultJson?.result?.sample;
    if (!sampleUrl) {
      return res.status(500).json({
        error: "BFL API Error",
        detail: "Missing result.sample in Ready response",
      });
    }

    // 3️⃣ DOWNLOAD ảnh từ sampleUrl → convert base64 để gửi cho frontend
    const imgRes = await fetch(sampleUrl);
    if (!imgRes.ok) {
      const t = await imgRes.text();
      return res.status(500).json({
        error: "Failed to download image from BFL delivery URL",
        detail: t,
      });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const imageBase64Result = `data:image/png;base64,${base64}`;

    // 4️⃣ Trả về cho frontend
    return res.status(200).json({
      success: true,
      result: {
        id: requestId,
        sample: sampleUrl, // URL ảnh (signed)
        imageBase64: imageBase64Result, // để bạn render trực tiếp trong <img src="..." />
      },
    });
  } catch (err: any) {
    console.error("Meme Gen Error:", err);
    return res.status(500).json({
      error: "Meme generation failed",
      detail: err?.message || String(err),
    });
  }
}
