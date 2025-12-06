
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY;
const fluxApiKey = process.env.FLUX_API_KEY; // User must provide this

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not defined.");
}
if (!fluxApiKey) {
  console.warn("FLUX_API_KEY is not defined. Image generation features may fail.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

/**
 * GENERIC FLUX API HANDLER
 * Since standard Flux doesn't have a single official SDK yet (available via Replicate, Fal, BFL),
 * we use a generic fetch structure targeting a hypothetical BFL-compatible endpoint.
 */
async function callFluxApi(prompt: string, imageBase64?: string, aspectRatio?: string): Promise<string> {
  // NOTE: This is a placeholder endpoint structure. 
  // In a real app, replace with 'https://api.replicate.com/v1/predictions' or 'https://api.bfl.ml/...'
  // and adjust the payload accordingly.
  const ENDPOINT = "https://api.bfl.ml/v1/flux-pro-1.1-ultra"; 
  
  // Simulating a response for the demo if no key is present, or erroring
  if (!fluxApiKey) {
     throw new Error("Missing FLUX_API_KEY in environment variables.");
  }

  try {
    const payload: any = {
      prompt: prompt,
      aspect_ratio: aspectRatio || "1:1",
      output_format: "png",
      safety_tolerance: 2
    };

    // If image provided, assuming an endpoint that supports img2img
    if (imageBase64) {
       payload.image_prompt = imageBase64; 
       payload.strength = 0.75;
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Key": fluxApiKey // Or "Authorization": `Bearer ${fluxApiKey}` depending on provider
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const err = await response.json();
       throw new Error(`Flux API Error: ${err.detail || response.statusText}`);
    }

    const data = await response.json();
    // Assuming standard response: { result: { sample: "url_or_base64" } } or similar
    // We return the URL or Base64
    return data.result?.sample || data.output || "";
  } catch (e) {
    console.error("Flux API Call Failed", e);
    // Fallback or re-throw
    throw new Error("Flux Image Generation Service Unavailable. Please check API Key.");
  }
}

/**
 * Edits an image using FLUX (via Image-to-Image / Inpainting logic).
 */
export const editImageWithGemini = async (
  base64Image: string, 
  prompt: string, 
  mimeType: string = 'image/png'
): Promise<string> => {
  // Using Flux for "Edit" - acting as Image-to-Image with prompt
  return await callFluxApi(`Edit this image: ${prompt}`, base64Image);
};

/**
 * Generates a Meme using FLUX (Text to Image with styling).
 */
export const generateMeme = async (
  prompt: string,
  style: string,
  base64Image?: string
): Promise<string> => {
  const finalPrompt = `A funny meme, ${style} style. Caption: "${prompt}". High quality, viral content.`;
  return await callFluxApi(finalPrompt, base64Image);
};

/**
 * Generates a Notion-style Personal Profile (HTML code).
 * KEEPS USING GEMINI 2.5 FLASH
 */
export const generateNotionProfile = async (userInfo: string): Promise<string> => {
  try {
    const prompt = `
      Create a single-file HTML (with embedded Tailwind CSS via CDN) for a Personal Profile Page in the style of "Notion" (Minimalist, emoji icons, clean typography, whitespace).
      
      User Information:
      ${userInfo}
      
      Requirements:
      - Use a Notion-like font stack (Inter, sans-serif).
      - Include a cover image placeholder (use unplash source url).
      - Include an emoji icon for the profile picture/icon.
      - Layout: Cover -> Icon -> Title (Name) -> Properties (Tags) -> Content sections.
      - Return ONLY the raw HTML code, no markdown backticks.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "";
    // Clean up markdown code blocks if present
    text = text.replace(/```html/g, '').replace(/```/g, '');
    return text;
  } catch (error) {
    console.error("Profile Gen Error:", error);
    throw error;
  }
};

/**
 * Rewrites text in a specific celebrity style.
 * KEEPS USING GEMINI 2.5 FLASH
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
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate text.";
  } catch (error) {
    console.error("Rewrite Error:", error);
    throw error;
  }
};