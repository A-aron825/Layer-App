
import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem, Outfit } from "../types";

// Prevent TypeScript errors if @types/node is missing
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to format wardrobe for prompt
const formatWardrobe = (items: ClothingItem[]) => 
  items.map(i => `- ${i.name} (Category: ${i.category}, ID: ${i.id})`).join('\n');

// --- CORE FEATURES ---

export const generateOutfitSuggestion = async (
  weather: string,
  style: string,
  occasion: string, 
  availableItems: ClothingItem[]
): Promise<{ description: string; reasoning: string; itemIds: string[]; error?: string }> => {
  if (availableItems.length < 3) {
    return { description: "", reasoning: "", itemIds: [], error: "Your wardrobe is too small. Upload at least 3-5 items to get quality suggestions." };
  }

  const prompt = `
    You are a professional fashion stylist.
    Current Weather: ${weather}.
    User's Preferred Style: ${style}.
    Occasion: ${occasion}.
    
    CRITICAL CONSTRAINT: You MUST ONLY suggest items from the following user wardrobe IDs.
    
    USER WARDROBE:
    ${formatWardrobe(availableItems)}
    
    Task: Suggest a complete outfit. Pick the 3-5 most appropriate items.
    
    Return a JSON object with:
    1. "description": A short, catchy title for the look.
    2. "reasoning": A 1-2 sentence explanation.
    3. "itemIds": An array of the exact IDs from the wardrobe provided above.
    4. "error": (Optional) Only if no matches possible.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            error: { type: Type.STRING },
          },
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      description: parsed.description || "Stylist Selection",
      reasoning: parsed.reasoning || "A curated look for you.",
      itemIds: parsed.itemIds || [],
      error: parsed.error
    };
  } catch (error) {
    return { description: "", reasoning: "", itemIds: [], error: "The Stylist AI is currently overwhelmed." };
  }
};

export const generateOutfitAroundItem = async (
  heroItem: ClothingItem,
  availableItems: ClothingItem[]
): Promise<{ description: string; reasoning: string; itemIds: string[]; error?: string }> => {
  const prompt = `
    Create a complete outfit built around this "Hero Piece": ${heroItem.name} (ID: ${heroItem.id}).
    
    USER WARDROBE:
    ${formatWardrobe(availableItems)}
    
    Return JSON with description, reasoning, and itemIds (including the hero ID: ${heroItem.id}).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            error: { type: Type.STRING },
          },
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      description: parsed.description || "Hero Focus Look",
      reasoning: parsed.reasoning || "Centered around your hero piece.",
      itemIds: parsed.itemIds || [heroItem.id],
      error: parsed.error
    };
  } catch (error) {
    return { description: "Curated Look", reasoning: "Focused on your hero piece.", itemIds: [heroItem.id] };
  }
};

export const analyzeClosetItem = async (base64Image: string): Promise<any> => {
   try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this clothing item. Return JSON with name, category (shirt/hoodie/bottom/shoes/outerwear/accessory), resaleEstimate (number), and sustainabilityScore (1-10)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            resaleEstimate: { type: Type.NUMBER },
            sustainabilityScore: { type: Type.NUMBER },
          },
        }
      }
    });
    return JSON.parse(response.text || "{}");
   } catch (error) {
     return { name: "Unknown Item", category: "shirt", resaleEstimate: 5, sustainabilityScore: 5 };
   }
}

export const chatWithStylist = async (message: string, history: any[], isMaster: boolean = false): Promise<string> => {
  const instruction = isMaster 
    ? "You are the Master Stylist, a hyper-advanced 1:1 style persona. You analyze fashion through the lens of fit, silhouette, and confidence."
    : "You are a professional fashion assistant.";
    
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history,
      config: { systemInstruction: instruction }
    });
    const result = await chat.sendMessage({ message: message });
    return result.text || "I'm processing your style data.";
  } catch (error) {
    return "I couldn't process that right now.";
  }
};

export const generateCelebrityLook = async (celebrity: string, items: ClothingItem[]): Promise<{ description: string; reasoning: string; itemIds: string[]; error?: string }> => {
  const prompt = `
    User wants to dress like: ${celebrity}.
    AVAILABLE WARDROBE: 
    ${formatWardrobe(items)}
    
    Pick 3-5 items from the list. Return JSON with description, reasoning, and itemIds.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            itemIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            error: { type: Type.STRING },
          },
        },
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      description: parsed.description || `${celebrity} Vibe`,
      reasoning: parsed.reasoning || "Inspired by the icon.",
      itemIds: parsed.itemIds || [],
      error: parsed.error
    };
  } catch (error) {
    return { description: "", reasoning: "", itemIds: [], error: "Could not generate look." };
  }
};

export const analyzeWardrobeGaps = async (items: ClothingItem[]): Promise<{ missingItems: string[]; reasoning: string }> => {
  const prompt = `
    Analyze this wardrobe: ${items.map(i => i.name).join(', ')}.
    Identify top 3-4 missing essentials. Return JSON.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            missingItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            reasoning: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { missingItems: ["Basic White Tee"], reasoning: "Analysis failed." };
  }
};

export const autoScheduleWeek = async (items: ClothingItem[], weather: string): Promise<{ schedule?: { day: string, description: string, note: string, itemIds: string[] }[], error?: string }> => {
  const prompt = `
    Plan a 7-day schedule (Mon-Sun).
    Context: ${weather}.
    USER WARDROBE:
    ${formatWardrobe(items)}
    Return JSON with a "schedule" array. Each day must include "itemIds".
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            schedule: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  description: { type: Type.STRING },
                  note: { type: Type.STRING },
                  itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            },
            error: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { error: "Scheduler timed out." };
  }
};

export const matchStyleDNA = async (items: ClothingItem[], communityFeed: any[]): Promise<string[]> => {
  const prompt = `Identify IDs of community posts that match user aesthetic.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
