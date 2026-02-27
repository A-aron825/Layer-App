
import { GoogleGenAI, Type } from "@google/genai";
import { ClothingItem } from "../types";

// Prevent TypeScript errors if @types/node is missing
declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- CORE FEATURES ---

export const generateOutfitSuggestion = async (
  weather: string,
  style: string,
  occasion: string, 
  availableItems: ClothingItem[]
): Promise<{ description: string; reasoning: string }> => {
  const prompt = `
    You are a professional fashion stylist.
    Current Weather: ${weather}.
    User's Preferred Style: ${style}.
    Occasion: ${occasion}.
    
    Task: Suggest a complete outfit (Top, Bottom, Shoes, Accessory).
    
    Return a JSON object with:
    1. "description": A short, catchy title for the look.
    2. "reasoning": A 1-2 sentence explanation of why this works.
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
          },
          required: ["description", "reasoning"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { description: "Casual Essentials", reasoning: "AI fallback." };
  }
};

export const analyzeClosetItem = async (base64Image: string): Promise<any> => {
   try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze this clothing item. Return JSON with name, category (top/bottom/shoes/outerwear/accessory), resaleEstimate (number), and sustainabilityScore (1-10)." }
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
     return { name: "Unknown Item", category: "top", resaleEstimate: 5, sustainabilityScore: 5 };
   }
}

export const chatWithStylist = async (message: string, history: any[]): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      history: history,
      config: { systemInstruction: "You are LayerBot, a sassy fashion assistant." }
    });
    const result = await chat.sendMessage({ message: message });
    return result.text || "I'm speechless.";
  } catch (error) {
    return "I couldn't process that right now.";
  }
};

export const generatePackingList = async (destination: string, days: number, activity: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Packing list for ${days} days in ${destination} for ${activity}. Return JSON with categories array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             categories: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   name: { type: Type.STRING },
                   items: { type: Type.ARRAY, items: { type: Type.STRING } }
                 }
               }
             }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { categories: [] };
  }
};

// --- EXISTING FEATURES ---

export const generateResaleListing = async (itemName: string): Promise<{ title: string; description: string; price: number; platform: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a resale listing for a used "${itemName}". Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            platform: { type: Type.STRING, description: "Best platform e.g. Poshmark, Depop" }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { title: itemName, description: "Great condition.", price: 20, platform: "Poshmark" };
  }
};

export const generateCelebrityLook = async (celebrity: string, items: ClothingItem[]): Promise<{ description: string; reasoning: string }> => {
  const prompt = `
    User wants to dress like: ${celebrity}.
    Available Items: ${items.map(i => i.name).join(', ')}.
    Task: Pick the best outfit from available items to match this style.
    Return JSON.
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
          },
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { description: "Celebrity Style", reasoning: "Could not generate look." };
  }
};

export const analyzeWardrobeGaps = async (items: ClothingItem[]): Promise<{ missingItems: string[]; reasoning: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these clothes: ${items.map(i => i.name).join(', ')}. What key essentials are missing? Return JSON.`,
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
    return { missingItems: ["Basic White Tee"], reasoning: "Every closet needs basics." };
  }
};

// --- NEW CLOSET TOOLS ---

// 1. Smart Purge (Donate/Sell)
export const generateSmartPurge = async (items: ClothingItem[]): Promise<{ purgeSuggestions: { itemName: string, action: string, reason: string }[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these items and their wear counts: ${items.map(i => `${i.name} (${i.wearCount} wears)`).join(', ')}. Suggest 3 items to purge (Donate/Sell/Recycle) based on low usage. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purgeSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemName: { type: Type.STRING },
                  action: { type: Type.STRING, description: "Donate, Sell, or Recycle" },
                  reason: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
     return { purgeSuggestions: [] };
  }
};

// 2. Color Palette Generator
export const generateColorPalette = async (items: ClothingItem[]): Promise<{ paletteName: string, colors: string[], description: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the implied colors of these items: ${items.map(i => i.name).join(', ')}. Create a 5-color hex palette that represents this wardrobe. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paletteName: { type: Type.STRING },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            description: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { paletteName: "Neutral Basics", colors: ["#FFFFFF", "#000000", "#808080", "#000080", "#F5F5DC"], description: "Safe and simple." };
  }
};

// 3. Three Ways to Wear (Item Detail)
export const generateThreeWaysToWear = async (item: ClothingItem, closet: ClothingItem[]): Promise<{ outfits: { style: string, items: string[], tip: string }[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Main Item: ${item.name} (${item.category}).
        Closet: ${closet.map(c => c.name).join(', ')}.
        Task: Create 3 distinct outfits using the Main Item + items from the Closet (or basics).
        Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outfits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  style: { type: Type.STRING, description: "e.g. Casual, Date Night" },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tip: { type: Type.STRING, description: "Styling tip" }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { 
      outfits: [
        { style: "Casual", items: [item.name, "Jeans", "Sneakers"], tip: "Keep it simple." },
        { style: "Smart", items: [item.name, "Blazer", "Loafers"], tip: "Tuck it in." },
        { style: "Edgy", items: [item.name, "Leather Jacket", "Boots"], tip: "Add contrast." }
      ] 
    };
  }
};
