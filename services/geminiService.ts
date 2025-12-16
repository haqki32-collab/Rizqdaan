
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) return ai;

  let apiKey = '';
  try {
    // Safely check for process.env availability to prevent browser crashes
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Failed to access process.env for Gemini API Key");
  }

  // Initialize client lazily. Even if key is missing, we init here to avoid crash on load.
  // The API call itself will fail later if key is invalid, which is handled in generateDescription.
  ai = new GoogleGenAI({ apiKey: apiKey });
  return ai;
};

export const generateDescription = async (keywords: string): Promise<string> => {
  const prompt = `Create a compelling and brief business listing description for a local Pakistani audience. The description should be engaging and highlight the key features. Use the following keywords as inspiration: "${keywords}". The output should be a single paragraph.`;

  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "Description could not be generated.";
  } catch (error: any) {
    console.error("Error generating description with Gemini:", error?.message || "Unknown error");
    return "We couldn't generate a description at this time. Please try writing one manually.";
  }
};
