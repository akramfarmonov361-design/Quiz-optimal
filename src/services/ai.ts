import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export async function generateQuizAI(topic: string): Promise<Question[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Mavzu: ${topic}. Shu mavzuda 5 ta qiziqarli test savolini o'zbek tilida tuzing. Har bir savol 3 ta variantdan iborat bo'lsin. To'g'ri javob indeksini (0, 1 yoki 2) ko'rsating. Orqa fon uchun mos unsplash rasm URL manzilini bering (masalan: https://images.unsplash.com/photo-...). Rasm URL manzillari haqiqiy va mavzuga mos bo'lishi kerak.`,
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
