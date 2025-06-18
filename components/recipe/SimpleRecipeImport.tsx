import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { amplifyClient } from '../../lib/amplify';
import { useAuth } from '../../lib/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useAIServices } from '../../hooks/useAIServices';

interface SimpleRecipeImportProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function SimpleRecipeImport({
  visible,
  onClose,
  onImportSuccess,
}: SimpleRecipeImportProps) {
  const { session } = useAuth();
  const { geminiModel, isAIReady } = useAIServices();
  const navigation = useNavigation<NavigationProp<any>>();
  const [importUrl, setImportUrl] = useState('');
  const [recipeText, setRecipeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'text'>('url');

  const parseRecipeFromText = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return null;

    let name = lines[0].trim();
    let ingredients: string[] = [];
    let instructions: string[] = [];
    let currentSection = 'none';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      if (line.includes('ingredient')) {
        currentSection = 'ingredients';
        continue;
      }
      if (line.includes('instruction') || line.includes('direction') || line.includes('step')) {
        currentSection = 'instructions';
        continue;
      }

      if (currentSection === 'ingredients' && lines[i].trim()) {
        ingredients.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
      } else if (currentSection === 'instructions' && lines[i].trim()) {
        instructions.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
      }
    }

    if (ingredients.length === 0 || instructions.length === 0) {
      // Simple fallback: split remaining lines
      const remaining = lines.slice(1);
      const midpoint = Math.floor(remaining.length / 2);
      ingredients = remaining.slice(0, midpoint).filter(l => l.trim());
      instructions = remaining.slice(midpoint).filter(l => l.trim());
    }

    return {
      name,
      ingredients: ingredients.length > 0 ? ingredients : ['No ingredients provided'],
      instructions: instructions.length > 0 ? instructions : ['No instructions provided'],
    };
  };

  const handleImportFromText = async () => {
    if (!recipeText.trim()) {
      Alert.alert('Error', 'Please enter recipe text');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Please sign in to import recipes');
      return;
    }

    setLoading(true);
    try {
      const parsedRecipe = parseRecipeFromText(recipeText);
      
      if (!parsedRecipe) {
        Alert.alert('Error', 'Could not parse recipe from text');
        return;
      }

      const { data: newRecipe } = await (amplifyClient.models as any).Recipe.create({
        userId: session.user.id,
        name: parsedRecipe.name,
        ingredients: JSON.stringify(parsedRecipe.ingredients),
        instructions: JSON.stringify(parsedRecipe.instructions),
        servings: 4,
        difficulty: 'medium',
        category: 'Main Course',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        tags: ['imported', 'text-import'],
      });

      if (newRecipe) {
        Alert.alert('Success!', `Recipe "${parsedRecipe.name}" imported successfully!`);
        onImportSuccess();
        setRecipeText('');
        onClose();
      } else {
        Alert.alert('Error', 'Failed to save imported recipe');
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Error', 'Failed to import recipe');
    } finally {
      setLoading(false);
    }
  };

  // Recipe type definitions
  interface ExtractedRecipe {
    name: string;
    servings: number;
    ingredients: string[];
    instructions: string[];
    difficulty: 'easy' | 'medium' | 'hard';
  }

  async function extractRecipeWithAI(
    model: { generateContent: (prompt: string) => Promise<{ response: { text: () => Promise<string> } }> },
    content: string
  ): Promise<ExtractedRecipe> {
    const prompt = `
Analyze this webpage content and extract a recipe.
Return ONLY a JSON object matching this exact schema:

{
  "name": "Clear recipe title",
  "servings": number,
  "ingredients": ["Each ingredient with amount"],
  "instructions": ["Step by step instructions"],
  "difficulty": "easy" | "medium" | "hard"
}

Webpage content:
${content}`;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();
    
    try {
      // Try parsing the entire response as JSON first
      const recipe = JSON.parse(responseText) as ExtractedRecipe;
      
      // Validate required fields
      if (!recipe.name || !Array.isArray(recipe.ingredients) || !Array.isArray(recipe.instructions)) {
        throw new Error('Invalid recipe format');
      }
      
      if (recipe.ingredients.length < 2 || recipe.instructions.length < 2) {
        throw new Error('Recipe must have at least 2 ingredients and 2 instructions');
      }

      return recipe;
    } catch (parseError) {
      // Fallback: Try to find JSON in the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Could not find JSON in response:', responseText);
        throw new Error('Could not extract recipe data');
      }
      
      const recipe = JSON.parse(jsonMatch[0]) as ExtractedRecipe;
      if (!recipe.name || recipe.ingredients.length < 2 || recipe.instructions.length < 2) {
        throw new Error('Could not extract a complete recipe');
      }

      return recipe;
    }
  }

  const handleImportFromUrl = async () => {
    // Validate requirements
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Please sign in to import recipes');
      return;
    }

    if (!isAIReady) {
      Alert.alert('Error', 'AI service is not available. Please try again later.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get and validate URL
      let fullUrl: string;
      try {
        const urlObj = new URL(importUrl);
        fullUrl = urlObj.toString();
      } catch {
        fullUrl = `https://${importUrl}`;
        try {
          new URL(fullUrl);
        } catch {
          throw new Error('Please enter a valid URL');
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log('🔗 Fetching recipe from:', fullUrl);
      
      const webResponse = await fetch(fullUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeBot/1.0)' }
      });
      
      clearTimeout(timeoutId);
      
      if (!webResponse.ok) {
        throw new Error('Could not load webpage. Please check the URL and try again.');
      }

      const html = await webResponse.text();
      
      // Clean and prepare content for AI
      const cleanContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
        .replace(/<[^>]+>/g, '\n')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 4000);

      // Extract recipe
      console.log('🤖 Using AI to extract recipe...');
      if (!geminiModel) {
        throw new Error('AI service is not available');
      }
      const extractedRecipe = await extractRecipeWithAI(geminiModel, cleanContent);
      console.log('✅ Successfully extracted recipe:', extractedRecipe.name);

      // 3. Save to database
      const { data: newRecipe } = await (amplifyClient.models as any).Recipe.create({
        userId: session.user.id,
        name: extractedRecipe.name.trim(),
        ingredients: JSON.stringify(extractedRecipe.ingredients.map((i: string) => i.trim())),
        instructions: JSON.stringify(extractedRecipe.instructions.map((i: string) => i.trim())),
        servings: extractedRecipe.servings || 4,
        difficulty: extractedRecipe.difficulty || 'medium',
        category: 'Imported',
        tags: ['imported', 'ai-extracted'],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });

      if (!newRecipe) {
        throw new Error('Failed to save the recipe');
      }

      Alert.alert(
        '✅ Recipe Imported!',
        `Successfully extracted and saved "${extractedRecipe.name}"`,
        [{
          text: 'OK',
          onPress: () => {
            onImportSuccess();
            setImportUrl('');
            onClose();
          }
        }]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Import error:', errorMessage);

      if (errorMessage.includes('URL') || errorMessage.includes('webpage') || errorMessage.includes('load')) {
        Alert.alert(
          'Website Error',
          'Could not load the recipe webpage. Please check the URL and your internet connection.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (errorMessage.includes('extract') || errorMessage.includes('recipe') || errorMessage.includes('AI')) {
        Alert.alert(
          'Extraction Failed',
          'Could not find a valid recipe on this webpage. Would you like to try pasting the recipe text directly?',
          [
            {
              text: 'Try Text Import',
              onPress: () => setActiveTab('text')
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Generic error
      Alert.alert(
        'Import Failed',
        'Something went wrong while importing the recipe. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Import Recipe</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'url' && styles.activeTab]}
            onPress={() => setActiveTab('url')}
          >
            <Ionicons name="link" size={16} color={activeTab === 'url' ? Colors.surface : Colors.primary} />
            <Text style={[styles.tabText, activeTab === 'url' && styles.activeTabText]}>
              From URL
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'text' && styles.activeTab]}
            onPress={() => setActiveTab('text')}
          >
            <Ionicons name="document-text" size={16} color={activeTab === 'text' ? Colors.surface : Colors.primary} />
            <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>
              From Text
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'url' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Import from Website URL</Text>
              <Text style={styles.sectionDescription}>
                Paste a URL from any recipe website to automatically import the recipe details
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="https://example.com/recipe"
                value={importUrl}
                onChangeText={setImportUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              <TouchableOpacity
                style={[
                  styles.importButton,
                  (!importUrl.trim() || loading || !session?.user?.id || !isAIReady) && styles.disabledButton
                ]}
                onPress={handleImportFromUrl}
                disabled={loading || !importUrl.trim() || !session?.user?.id || !isAIReady}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Ionicons name="download" size={16} color={Colors.surface} />
                )}
                <Text style={styles.importButtonText}>
                  {!session?.user?.id
                    ? 'Sign in to Import'
                    : !isAIReady
                      ? 'AI Not Available'
                      : loading
                        ? 'Importing Recipe...'
                        : 'Import Recipe'}
                </Text>
              </TouchableOpacity>

              <View style={styles.infoBox}>
                <Ionicons name="sparkles" size={20} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Smart Recipe Import</Text>
                  <Text style={styles.infoText}>
                    • Import from any recipe website{'\n'}
                    • Automatic ingredient parsing{'\n'}
                    • Clean step-by-step formatting
                  </Text>
                  <Text style={[styles.infoText, styles.infoNote]}>
                    {isAIReady ? (
                      '✨ AI-powered extraction ready!'
                    ) : (
                      <Text>
                        <Ionicons name="alert-circle" size={14} color={Colors.warning} />{' '}
                        Service unavailable - Use text import instead
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Import from Text</Text>
              <Text style={styles.sectionDescription}>
                Paste or type recipe text. Include the recipe name, ingredients, and instructions.
              </Text>
              
              <TextInput
                style={styles.textArea}
                placeholder={`Recipe Name

Ingredients:
- 2 cups flour
- 1 cup sugar
- 3 eggs

Instructions:
1. Mix dry ingredients
2. Add eggs and mix
3. Bake for 30 minutes`}
                value={recipeText}
                onChangeText={setRecipeText}
                multiline
                numberOfLines={12}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[styles.importButton, !recipeText.trim() && styles.disabledButton]}
                onPress={handleImportFromText}
                disabled={loading || !recipeText.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Ionicons name="add-circle" size={16} color={Colors.surface} />
                )}
                <Text style={styles.importButtonText}>
                  {loading ? 'Importing...' : 'Import Recipe'}
                </Text>
              </TouchableOpacity>

              <View style={styles.tipsBox}>
                <Text style={styles.tipsTitle}>💡 Import Tips</Text>
                <Text style={styles.tipsText}>
                  • Start with the recipe name on the first line{'\n'}
                  • Use "Ingredients:" or "Instructions:" to separate sections{'\n'}
                  • List ingredients and instructions line by line{'\n'}
                  • The system will automatically parse and format your recipe
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  activeTabText: {
    color: Colors.surface,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeights.relaxed,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: Spacing.lg,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: Spacing.lg,
    minHeight: 200,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  disabledButton: {
    backgroundColor: Colors.textTertiary,
  },
  importButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    lineHeight: Typography.lineHeights.relaxed,
  },
  infoNote: {
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  tipsBox: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  tipsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed,
  },
});