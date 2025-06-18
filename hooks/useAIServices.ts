import { useEffect, useState } from 'react';
import { useUserProfile } from './useUserProfile';

interface GenerativeModel {
  generateContent: (prompt: string) => Promise<{
    response: { text: () => Promise<string> }
  }>;
}

let geminiModelInstance: GenerativeModel | null = null;

export function useAIServices() {
  const { profile } = useUserProfile();
  const [isAIReady, setIsAIReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAI = async () => {
      try {
        if (!profile?.geminiApiKey) {
          setIsAIReady(false);
          return;
        }

        if (!geminiModelInstance) {
          // Create API wrapper
          geminiModelInstance = {
            generateContent: async (prompt: string) => {
              const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': profile.geminiApiKey,
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
                throw new Error('AI service error');
              }

              const result = await response.json();
              if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid AI response');
              }

              return {
                response: {
                  text: async () => result.candidates[0].content.parts[0].text
                }
              };
            }
          };
        }
        
        setIsAIReady(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize AI:', err);
        setIsAIReady(false);
        setError('Could not initialize AI service');
      }
    };

    initAI();
  }, [profile?.geminiApiKey]);

  return {
    geminiModel: geminiModelInstance,
    isAIReady,
    error,
  };
}