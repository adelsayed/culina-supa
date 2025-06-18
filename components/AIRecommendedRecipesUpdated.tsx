import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';

interface AIRecipeRecommendation {
  name: string;
  description: string;
  cuisine: string;
  calories: number;
  cookTime: string;
  difficulty: string;
  ingredients: string[];
  instructions: string[];
}

export default function AIRecommendedRecipes() {
  const { profile } = useUserProfile();
  const [recommendations, setRecommendations] = useState<AIRecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCurlCommand = () => {
    if (!profile) return 'Profile not available';
    
    const provider = profile.aiProvider || 'openai';
    const prompt = `Generate 5 trending and popular recipe recommendations based on this user profile:

User Profile:
- Dietary restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${profile.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${profile.dislikedIngredients?.join(', ') || 'None'}
- Preferred cuisines: ${profile.preferredCuisines?.join(', ') || 'Various'}
- Daily calorie target: ${profile.dailyCalorieTarget || 'Not specified'}
- Weight goal: ${profile.weightGoal || 'Not specified'}
- Activity level: ${profile.activityLevel || 'Not specified'}

Requirements:
- Include trending recipes from the internet and social media
- Consider seasonal ingredients and current food trends
- Ensure recipes match dietary restrictions and avoid allergies
- Aim for the calorie range if specified
- Prefer the user's favorite cuisines when possible

Return ONLY a valid JSON array of 5 recipes with this exact format:
[
  {
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "cuisine": "Cuisine type",
    "calories": 450,
    "cookTime": "30 minutes",
    "difficulty": "Easy",
    "ingredients": ["ingredient 1", "ingredient 2", "..."],
    "instructions": ["Step 1", "Step 2", "..."]
  }
]`;

    if (provider === 'gemini') {
      let geminiModel = 'gemini-pro';
      if (profile.aiModel === 'gemini_pro_vision') {
        geminiModel = 'gemini-pro-vision';
      }
      return `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${profile.geminiApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{
      "parts": [{
        "text": ${JSON.stringify(prompt)}
      }]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 1500
    }
  }'`;
    } else {
      let actualModel = 'gpt-3.5-turbo';
      if (profile.aiModel === 'gpt4') {
        actualModel = 'gpt-4';
      } else if (profile.aiModel === 'gpt4turbo') {
        actualModel = 'gpt-4-turbo-preview';
      }
      
      return `curl -X POST https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${profile.openaiApiKey}" \\
  -d '{
    "model": "${actualModel}",
    "messages": [
      {
        "role": "user",
        "content": ${JSON.stringify(prompt)}
      }
    ],
    "max_tokens": 1500,
    "temperature": 0.7
  }'`;
    }
  };

  const generateRecommendations = async () => {
    if (!profile) {
      setError('Profile not available');
      return;
    }

    const provider = profile.aiProvider || 'openai';
    const hasApiKey = provider === 'openai' ? profile.openaiApiKey : profile.geminiApiKey;
    
    if (!hasApiKey) {
      setError(`${provider === 'openai' ? 'OpenAI' : 'Google Gemini'} API key required for AI recommendations`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a personalized prompt based on user profile
      const prompt = `
Generate 5 trending and popular recipe recommendations based on this user profile:

User Profile:
- Dietary restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
- Allergies: ${profile.allergies?.join(', ') || 'None'}
- Disliked ingredients: ${profile.dislikedIngredients?.join(', ') || 'None'}
- Preferred cuisines: ${profile.preferredCuisines?.join(', ') || 'Various'}
- Daily calorie target: ${profile.dailyCalorieTarget || 'Not specified'}
- Weight goal: ${profile.weightGoal || 'Not specified'}
- Activity level: ${profile.activityLevel || 'Not specified'}

Requirements:
- Include trending recipes from the internet and social media
- Consider seasonal ingredients and current food trends
- Ensure recipes match dietary restrictions and avoid allergies
- Aim for the calorie range if specified
- Prefer the user's favorite cuisines when possible

Return ONLY a valid JSON array of 5 recipes with this exact format:
[
  {
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "cuisine": "Cuisine type",
    "calories": 450,
    "cookTime": "30 minutes",
    "difficulty": "Easy",
    "ingredients": ["ingredient 1", "ingredient 2", "..."],
    "instructions": ["Step 1", "Step 2", "..."]
  }
]
`;

      let response;
      let content;

      if (provider === 'gemini') {
        // Google Gemini API call
        const geminiModel = profile.aiModel === 'gemini-pro-vision' ? 'gemini-pro-vision' : 'gemini-pro';
        
        console.log('Making Gemini API request with model:', geminiModel);
        
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${profile.geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            }
          })
        });

        console.log('Gemini response status:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.log('Gemini error response:', errorData);
          throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
          throw new Error('No response from Gemini');
        }

      } else {
        // OpenAI API call
        let actualModel = 'gpt-3.5-turbo';
        if (profile.aiModel === 'gpt4') {
          actualModel = 'gpt-4';
        } else if (profile.aiModel === 'gpt4turbo') {
          actualModel = 'gpt-4-turbo-preview';
        } else if (profile.aiModel === 'gpt35turbo') {
          actualModel = 'gpt-3.5-turbo';
        }

        console.log('Making OpenAI API request with model:', actualModel);

        const requestBody = {
          model: actualModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.7,
        };

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${profile.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('OpenAI response status:', response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.log('OpenAI error response:', errorData);
          throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No response from OpenAI');
        }
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error(`Invalid response format from ${provider}`);
      }

      const recipes = JSON.parse(jsonMatch[0]);
      setRecommendations(recipes);

    } catch (err: any) {
      console.error('AI recommendation error:', err);
      
      // Handle specific errors
      if (err.message?.includes('429')) {
        setError('Rate limit exceeded. Please wait a few minutes before requesting new recommendations.');
      } else if (err.message?.includes('401')) {
        setError(`Invalid ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key. Please check your API key in Profile settings.`);
      } else if (err.message?.includes('402')) {
        setError(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} quota exceeded. Please check your account billing.`);
      } else {
        setError(err.message || 'Failed to generate AI recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate recommendations when component mounts (if API key is available)
  useEffect(() => {
    if (!profile) return;
    
    const provider = profile.aiProvider || 'openai';
    const hasApiKey = provider === 'openai' ? profile.openaiApiKey : profile.geminiApiKey;
    
    if (hasApiKey && profile.smartRecommendationsEnabled) {
      generateRecommendations();
    }
  }, [profile?.openaiApiKey, profile?.geminiApiKey, profile?.aiProvider, profile?.smartRecommendationsEnabled]);

  const provider = profile?.aiProvider || 'openai';
  const hasApiKey = provider === 'openai' ? profile?.openaiApiKey : profile?.geminiApiKey;

  if (!hasApiKey) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recipe Recommendations</Text>
        <Text style={styles.setupText}>
          Set up your {provider === 'openai' ? 'OpenAI' : 'Google Gemini'} API key in Profile → AI Settings to get personalized recipe recommendations from the internet!
        </Text>
      </View>
    );
  }

  if (!profile?.smartRecommendationsEnabled) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Recipe Recommendations</Text>
        <Text style={styles.setupText}>
          Enable Smart Recommendations in Profile → AI Settings to get AI-powered recipe suggestions!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>
          🤖 {provider === 'openai' ? 'OpenAI' : 'Gemini'} Recipe Recommendations
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => console.log(generateCurlCommand())}
          >
            <Text style={styles.debugText}>📋 Show cURL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={generateRecommendations}
            disabled={loading}
          >
            <Text style={styles.refreshText}>
              {loading ? 'Generating...' : '🔄 Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            Generating personalized recommendations using {provider === 'openai' ? 'OpenAI' : 'Google Gemini'}...
          </Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {recommendations.map((recipe, index) => (
          <View key={index} style={styles.recipeCard}>
            <Text style={styles.recipeName}>{recipe.name}</Text>
            <Text style={styles.recipeDescription}>{recipe.description}</Text>
            
            <View style={styles.recipeMetrics}>
              <Text style={styles.metricText}>🍽️ {recipe.cuisine}</Text>
              <Text style={styles.metricText}>🔥 {recipe.calories} cal</Text>
              <Text style={styles.metricText}>⏱️ {recipe.cookTime}</Text>
              <Text style={styles.metricText}>📊 {recipe.difficulty}</Text>
            </View>

            <Text style={styles.ingredientsTitle}>Ingredients:</Text>
            <Text style={styles.ingredientsList}>
              {recipe.ingredients.slice(0, 3).join(', ')}
              {recipe.ingredients.length > 3 && '...'}
            </Text>

            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Recipe</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {recommendations.length === 0 && !loading && !error && (
        <Text style={styles.emptyText}>
          Tap "Refresh" to generate AI-powered recipe recommendations!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  refreshText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  setupText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  scroll: {
    flexDirection: 'row',
  },
  recipeCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  recipeMetrics: {
    marginBottom: 12,
  },
  metricText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  ingredientsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ingredientsList: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  debugText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
});