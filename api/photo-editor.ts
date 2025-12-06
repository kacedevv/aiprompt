export const config = {
  runtime: "nodejs",
};

function getFluxKey() {
  const key =
    process.env.BFL_API_KEY ||
    process.env.VITE_FLUX_API_KEY ||
    process.env.FLUX_API_KEY ||
    "";

  console.log("DEBUG BFL_API_KEY EXIST:", key ? "YES" : "NO");
  return key;
}

type RequestBody = {
  prompt?: string;
  imageBase64?: string;
  aspectRatio?: string;
};

function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);

    let data = "";
    req.on("data", (c: any) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req: any, res: any) {
  // CORS
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const BFL_API_KEY = getFluxKey();
  if (!BFL_API_KEY)
    return res.status(500).json({
      error: "Missing BFL_API_KEY (BFL_API_KEY / VITE_FLUX_API_KEY / FLUX_API_KEY)",
    });

  try {
    const body: RequestBody = await parseBody(req);
    const { prompt, imageBase64, aspectRatio } = body;

    if (!imageBase64)
      return res.status(400).json({ error: "Missing imageBase64" });

    const finalPrompt = prompt
      ? `Edit this image: ${prompt}`
      : "Enhance this photo with better lighting + colors.";

    const payload: any = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio || "1:1",
      output_format: "png",
      image_prompt: imageBase64,
      strength: 0.75,
    };

    // 1️⃣ Submit
    const submitRes = await fetch("https://api.bfl.ml/v1/flux-pro-1.1-ultra", {
      method: "POST",
      headers: {
        accept: "application/json",
        "x-key": BFL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const submitTxt = await submitRes.text();
    let submitJson = null;
    try {
      submitJson = JSON.parse(submitTxt);
    } catch {}

    if (!submitRes.ok)
      return res.status(500).json({
        error: "BFL Submit Error",
        detail: submitJson || submitTxt,
      });

    const pollingUrl = submitJson?.polling_url;
    if (!pollingUrl)
      return res.status(500).json({
        error: "Missing polling_url",
        detail: submitJson,
      });

    // 2️⃣ Poll
    let ready: any = null;
    for (let i = 0; i < 30; i++) {
      await sleep(500);
      const pollRes = await fetch(pollingUrl, {
        headers: {
          accept: "application/json",
          "x-key": BFL_API_KEY,
        },
      });

      const pollTxt = await pollRes.text();
      let pollJson = null;
      try {
        pollJson = JSON.parse(pollTxt);
      } catch {}

      if (!pollRes.ok)
        return res.status(500).json({
          error: "BFL Poll Error",
          detail: pollJson || pollTxt,
        });

      if (pollJson?.status === "Ready") {
        ready = pollJson;
        break;
      }

      if (
        pollJson?.status === "Error" ||
        pollJson?.status === "Failed" ||
        pollJson?.status === "Content Moderated"
      ) {
        return res.status(500).json({
          error: "BFL Processing Failed",
          detail: pollJson,
        });
      }
    }

    if (!ready)
      return res.status(500).json({ error: "Timeout", detail: "No Ready" });

    const sample = ready?.result?.sample;
    if (!sample)
      return res.status(500).json({
        error: "Missing sample URL",
        detail: ready,
      });

    // 3️⃣ Download result
    const imgRes = await fetch(sample);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const base64 = `data:image/png;base64,${buffer.toString("base64")}`;

    return res.status(200).json({
      success: true,
      result: { sample, imageBase64: base64 },
    });
  } catch (e: any) {
    console.error("PhotoEditor Error:", e);
    return res.status(500).json({ error: "Internal Error", detail: e.message });
  }
}
