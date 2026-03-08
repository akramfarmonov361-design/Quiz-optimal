import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export async function generateQuizAI(topic: string, language: string = 'uz'): Promise<Question[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const languageNames: Record<string, string> = {
      uz: "Uzbek",
      ru: "Russian",
      en: "English"
    };
    const langName = languageNames[language] || "Uzbek";

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Topic: ${topic}. Create 5 interesting quiz questions about this topic in ${langName}. The questions and options must be written in ${langName}. Each question must have exactly 3 options. Indicate the correct option index (0, 1, or 2). Provide a suitable unsplash image URL for the background (e.g. https://images.unsplash.com/photo-...). The image URLs must be real and relevant to the topic.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Savol matni" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ta variant" },
              correctOptionIndex: { type: Type.INTEGER, description: "To'g'ri javob indeksi (0, 1 yoki 2)" },
              backgroundImage: { type: Type.STRING, description: "Unsplash rasm URL manzili" }
            },
            required: ["text", "options", "correctOptionIndex", "backgroundImage"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    return data.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("AI generation failed:", error);
    return null;
  }
}
