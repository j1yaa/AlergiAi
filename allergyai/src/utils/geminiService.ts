import axios from 'axios';
import { GEMINI_API_KEY } from '@env';

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiScanResult {
    productName: string;
    detectedIngredients: string[];
}

export const analyzeImg = async (base64Img: string): Promise<GeminiScanResult> => {
    try {
        const prompt = `Analyze this image of the food item or the label. 
        Extract the product name and list the ingredients found. Respond with ONLY a JSON object in the format: {
            "productName": "The Product Name",
            "detectedIngredients": ["ingredient 1", "ingredient 2", ...]
        }
        If the product name or ingredients could not be detected,
        return an empty array for ingredients and an empty string for the product name.`;

        const response = await axios.post(API_URL, {
            contents: [{
                parts: [{ text: prompt },
                    {
                        inline_data: {
                            mime_type: "image/jpeg",
                            data: base64Img
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.2,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
                stopSequences: []
            }
        });

        if (response.data.candidates && response.data.candidates.length > 0) {
            const rawText = response.data.candidates[0].content.parts[0].text;
            const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                const scannedResult: GeminiScanResult = JSON.parse(jsonText);
                return scannedResult;
            } catch {
                console.error('Failed to parse JSON from Gemini response:', jsonText);
                throw new Error('Failed to parse Gemini analysis result');
            }
        } else {
            if (response.data.promptFeedback) {
                console.error('Image analysis blocked:', response.data.promptFeedback);
                const blockReason = response.data.promptFeedback.blockReason;
                const safetyRatings = response.data.promptFeedback.safetyRatings.map((r: {
                    category: string,
                    probability: string;
                }) => `${r.category}: ${r.probability}`).join(', ');
                throw new Error(`Image analysis was blocked. Reason: ${blockReason}. Safety rating: ${safetyRatings}`);
            }
            throw new Error("Could not analyze the image. No results returned.");
        }
    } catch (error: any) {
        console.error('Error analyzing the image with Gemini:', error.response ? error.response.data : error.message);
        throw new Error('Failed to analyze the image with Gemini.');
    }
};