interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface GenerativeModel {
  generateContent: (prompt: string) => Promise<{
    response: {
      text: () => Promise<string>;
    };
  }>;
}

// Cache the model instance
let cachedModel: GenerativeModel | null = null;

export async function getGeminiAI(apiKey: string): Promise<GenerativeModel> {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }

  // Return cached model if available
  if (cachedModel) {
    return cachedModel;
  }

  // Create a wrapper around the Gemini API
  cachedModel = {
    generateContent: async (prompt: string) => {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
            }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          if (error.error?.message?.includes('API key')) {
            throw new Error('Invalid API key');
          }
          throw new Error('Gemini API request failed');
        }

        const result: GeminiResponse = await response.json();
        if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response from Gemini API');
        }

        return {
          response: {
            text: async () => result.candidates[0].content.parts[0].text
          }
        };
      } catch (error) {
        console.error('Gemini API error:', error);
        throw error instanceof Error ? error : new Error('Failed to generate content');
      }
    }
  };

  return cachedModel;
}

export function clearGeminiCache() {
  cachedModel = null;
}