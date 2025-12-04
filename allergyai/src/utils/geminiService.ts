import axios from 'axios';
import { GEMINI_API_KEY } from '@env';
console.log(
  '[Gemini] key prefix (from @env):',
  GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 6) : 'MISSING'
);

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiScanResult {
    productName: string;
    detectedIngredients: string[];
}

export const analyzeImg = async (base64Img: string): Promise<GeminiScanResult> => {
  try {
    const prompt = `
      You are an allergy-scanner assistant.

      Given an IMAGE of a food item OR an ingredients label, you must return ONLY a JSON object:

      {
        "productName": "name of the food or product",
        "detectedIngredients": ["ingredient1", "ingredient2", ...]
      }

      Rules:
      - If the image shows a single obvious food (e.g., banana, apple, egg),
        use that as both the productName and a single item in detectedIngredients.
        Example for a banana photo:
        {
          "productName": "Banana",
          "detectedIngredients": ["banana"]
        }

      - If there is an ingredients LABEL, extract as many ingredients as you can from the text.

      - If you truly cannot identify the food OR ingredients:
        * use "Unknown" for productName
        * use an empty array [] for detectedIngredients.

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
            productName = 'No product detected';
          }
        }

        return {
          productName,
          detectedIngredients,
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
