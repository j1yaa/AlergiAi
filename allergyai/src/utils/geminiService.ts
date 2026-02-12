import axios from 'axios';
import { GEMINI_API_KEY } from '@env';
console.log(
  '[Gemini] key prefix (from @env):',
  GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 6) : 'MISSING'
);

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiScanResult {
    productName: string;
    detectedIngredients: string[];
    allergenCategories: string[];
    isFood: boolean;
}

export const analyzeImg = async (base64Img: string): Promise<GeminiScanResult> => {
  try {
    const prompt = `
      You are an allergy-scanner assistant.

      Given an IMAGE, you must return ONLY a JSON object:

      {
        "productName": "name of the food or product",
        "detectedIngredients": ["ingredient1", "ingredient2", ...],
        "allergenCategories": ["category1", "category2", ...],
        "isFood": true
      }

      Rules:
      - First, determine if the image shows a FOOD ITEM, a FOOD LABEL, or a NON-FOOD item.

      - If the item is NOT food (e.g., play dough, soap, cleaning products, toys, tools,
        clothing, electronics, or any other non-edible item), return:
        {
          "productName": "name of the item (e.g. Play Dough)",
          "detectedIngredients": [],
          "allergenCategories": [],
          "isFood": false
        }

      - If you truly cannot identify what the item is at all, return:
        {
          "productName": "Unknown",
          "detectedIngredients": [],
          "allergenCategories": [],
          "isFood": false
        }

      - If the image shows a single obvious food (e.g., banana, apple, egg),
        use that as both the productName and a single item in detectedIngredients.
        Example for a milk photo:
        {
          "productName": "Milk",
          "detectedIngredients": ["milk"],
          "allergenCategories": ["dairy"],
          "isFood": true
        }

      - If there is an ingredients LABEL, extract as many ingredients as you can from the text.
        Set "isFood": true.

      - For "allergenCategories", identify ALL major allergen categories that ANY of the
        detected ingredients belong to. Use these standard category names:
        dairy, eggs, peanuts, tree nuts, shellfish, fish, wheat, gluten, soy, sesame,
        mustard, celery, lupin, mollusk, banana, mango, shrimp.
        An ingredient can belong to multiple categories.
        Examples: milk -> dairy, shrimp -> shellfish, flour -> wheat/gluten,
        cheese -> dairy, almond -> tree nuts, mayo -> eggs.

      Return ONLY the JSON. No explanations, no markdown fences, no backticks.
    `;

    const response = await axios.post(API_URL, {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Img,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
        stopSequences: [],
      },
    });

    if (response.data.candidates && response.data.candidates.length > 0) {
      const rawText = response.data.candidates[0].content.parts[0].text;
      const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed: GeminiScanResult = JSON.parse(jsonText);

        // --- Normalize the result so the rest of the app gets clean data ---
        let productName = parsed.productName?.trim() || '';
        const detectedIngredients =
          parsed.detectedIngredients?.map((i) => i.trim().toLowerCase()) || [];

        // Fallback if Gemini returns empty / "Unknown" product name
        if (!productName || productName.toLowerCase() === 'unknown') {
          if (detectedIngredients.length > 0) {
            const first = detectedIngredients[0];
            productName = first.charAt(0).toUpperCase() + first.slice(1);
          } else {
            // Keep "Unknown" so the result screen can distinguish
            // "unrecognizable" from "recognized but not food"
            productName = 'Unknown';
          }
        }

        const allergenCategories =
          parsed.allergenCategories?.map((c) => c.trim().toLowerCase()) || [];

        const isFood = parsed.isFood !== false;

        return {
          productName,
          detectedIngredients,
          allergenCategories,
          isFood,
        };
      } catch {
        console.error('Failed to parse JSON from Gemini response:', jsonText);
        throw new Error('Failed to parse Gemini analysis result');
      }
    } else {
      if (response.data.promptFeedback) {
        console.error('Image analysis blocked:', response.data.promptFeedback);
        const blockReason = response.data.promptFeedback.blockReason;
        const safetyRatings = response.data.promptFeedback.safetyRatings
          .map(
            (r: { category: string; probability: string }) =>
              `${r.category}: ${r.probability}`,
          )
          .join(', ');
        throw new Error(
          `Image analysis was blocked. Reason: ${blockReason}. Safety rating: ${safetyRatings}`,
        );
      }

      throw new Error('Could not analyze the image. No results returned.');
    }
  } catch (error: any) {
    console.error(
      'Error analyzing the image with Gemini:',
      error?.response ? error.response.data : error.message,
    );
    throw new Error('Failed to analyze the image with Gemini.');
  }
};
