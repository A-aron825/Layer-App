
import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem, Outfit } from "../types";

// Prevent TypeScript errors if @types/node is missing
declare var process: {
  env: {
    GEMINI_API_KEY: string;
    [key: string]: string | undefined;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    return { 
      description: "", 
      reasoning: "", 
      itemIds: [], 
      error: "Your Style Vault is too empty. Upload at least 3-5 items to allow the AI to synthesize a look." 
    };
  }

  const prompt = `
    You are a world-class fashion stylist and aesthetic consultant.
    
    CONTEXT:
    - Weather: ${weather}
    - Style Vibe: ${style}
    - Occasion: ${occasion}
    
    USER WARDROBE (EXACT ITEMS AVAILABLE):
    ${formatWardrobe(availableItems)}
    
    TASK:
    Synthesize a complete, high-fashion outfit using ONLY the items listed above. 
    Pick 3-5 items that create a cohesive and stylish ensemble appropriate for the weather and occasion.
    
    CRITICAL RULES:
    1. You MUST ONLY use IDs from the provided USER WARDROBE.
    2. Do NOT suggest items that are not in the list.
    3. Return a valid JSON object.
    
    OUTPUT SCHEMA:
    {
      "description": "A short, punchy, high-fashion title for the look",
      "reasoning": "A 1-2 sentence professional styling justification",
      "itemIds": ["id1", "id2", "id3"],
      "error": "Optional error message if no cohesive look can be formed"
    }
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
          required: ["description", "reasoning", "itemIds"]
        },
      },
    });
    
    const parsed = JSON.parse(response.text || "{}");
    
    // Validate itemIds against available items to prevent hallucinations
    const validIds = (parsed.itemIds || []).filter((id: string) => 
      availableItems.some(item => item.id === id)
    );

    if (validIds.length === 0 && !parsed.error) {
      return { 
        description: "", 
        reasoning: "", 
        itemIds: [], 
        error: "The AI couldn't find a cohesive match in your current vault. Try adding more variety!" 
      };
    }

    return {
      description: parsed.description || "Neural Ensemble",
      reasoning: parsed.reasoning || "A curated selection based on your unique style DNA.",
      itemIds: validIds,
      error: parsed.error
    };
  } catch (error) {
    console.error("Stylist AI Error:", error);
    return { description: "", reasoning: "", itemIds: [], error: "The Stylist AI is currently recalibrating. Please try again in a moment." };
  }
};

export const generateOutfitAroundItem = async (
  heroItem: ClothingItem,
  availableItems: ClothingItem[]
): Promise<{ description: string; reasoning: string; itemIds: string[]; error?: string }> => {
  const prompt = `
    Create a complete, high-fashion outfit built specifically around this "Hero Piece": ${heroItem.name} (ID: ${heroItem.id}).
    
    USER WARDROBE (EXACT ITEMS AVAILABLE):
    ${formatWardrobe(availableItems)}
    
    TASK:
    Suggest 2-4 complementary items from the list above that elevate the Hero Piece.
    
    CRITICAL RULES:
    1. You MUST ONLY use IDs from the provided USER WARDROBE.
    2. The Hero Piece ID (${heroItem.id}) MUST be included in the itemIds array.
    3. Return a valid JSON object.
    
    OUTPUT SCHEMA:
    {
      "description": "A short, punchy title for the ensemble",
      "reasoning": "A concise styling tip for this specific combination",
      "itemIds": ["${heroItem.id}", "id2", "id3"]
    }
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
          required: ["description", "reasoning", "itemIds"]
        },
      },
    });
    
    const parsed = JSON.parse(response.text || "{}");
    
    // Ensure hero item is included and validate others
    let validIds = (parsed.itemIds || []).filter((id: string) => 
      availableItems.some(item => item.id === id)
    );
    
    if (!validIds.includes(heroItem.id)) {
      validIds = [heroItem.id, ...validIds];
    }

    return {
      description: parsed.description || "Hero Focus Look",
      reasoning: parsed.reasoning || "Centered around your selected statement piece.",
      itemIds: validIds,
      error: parsed.error
    };
  } catch (error) {
    console.error("Orbit AI Error:", error);
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
  if (items.length < 3) {
    return { 
      description: "", 
      reasoning: "", 
      itemIds: [], 
      error: "Neural mimicry requires a larger data set. Upload more items to match this icon's style." 
    };
  }

  const prompt = `
    User wants to channel the aesthetic of: ${celebrity}.
    
    USER WARDROBE (EXACT ITEMS AVAILABLE):
    ${formatWardrobe(items)}
    
    TASK:
    Select 3-5 items from the list above that best capture the essence of ${celebrity}'s signature style.
    
    CRITICAL RULES:
    1. You MUST ONLY use IDs from the provided USER WARDROBE.
    2. Return a valid JSON object.
    
    OUTPUT SCHEMA:
    {
      "description": "A title for the celebrity-inspired look",
      "reasoning": "How this ensemble captures ${celebrity}'s vibe using the user's items",
      "itemIds": ["id1", "id2", "id3"]
    }
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
          required: ["description", "reasoning", "itemIds"]
        },
      },
    });
    
    const parsed = JSON.parse(response.text || "{}");
    
    const validIds = (parsed.itemIds || []).filter((id: string) => 
      items.some(item => item.id === id)
    );

    return {
      description: parsed.description || `${celebrity} Aesthetic`,
      reasoning: parsed.reasoning || "A look meticulously sampled from your style twin's visual DNA.",
      itemIds: validIds,
      error: parsed.error
    };
  } catch (error) {
    console.error("Celebrity AI Error:", error);
    return { description: "", reasoning: "", itemIds: [], error: "Neural core failed to synthesize the celebrity profile." };
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
    Plan a 7-day style schedule (Mon-Sun).
    
    CONTEXT:
    - Weather: ${weather}
    
    USER WARDROBE (EXACT ITEMS AVAILABLE):
    ${formatWardrobe(items)}
    
    TASK:
    Generate 7 DIFFERENT and VARIED outfits, one for each day of the week. 
    Each outfit should be unique and use a different combination of items from the wardrobe.
    Do NOT repeat the same outfit combination for multiple days.
    
    CRITICAL RULES:
    1. You MUST ONLY use IDs from the provided USER WARDROBE.
    2. Each day MUST have a unique set of itemIds.
    3. Return a valid JSON object.
    
    OUTPUT SCHEMA:
    {
      "schedule": [
        {
          "day": "Monday",
          "description": "Look title",
          "note": "Styling tip",
          "itemIds": ["id1", "id2"]
        },
        ...
      ]
    }
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
