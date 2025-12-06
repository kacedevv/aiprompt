export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const BFL_API_KEY = process.env.BFL_API_KEY;
  if (!BFL_API_KEY) {
    return res.status(500).json({ error: "Missing BFL_API_KEY" });
  }

  try {
    const { prompt, imageBase64 } = await new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(JSON.parse(data)));
    });

    const payload = {
      prompt,
      image_prompt: imageBase64,
      strength: 0.75,
      output_format: "png"
    };

    const response = await fetch("https://api.bfl.ml/v1/flux-pro-1.1-ultra", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": BFL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const raw = await response.text();

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: raw });
    }

    if (!response.ok) {
      return res.status(500).json({ error: "BFL API Error", detail: json });
    }

    return res.status(200).json({
      success: true,
      result: json,
    });
  } catch (e) {
    return res.status(500).json({
      error: "Photo Edit Error",
      detail: e.message,
    });
  }
}
