import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/DesignSystem';
import { RecipeImportService, RecipeExportService, TextRecipeParser } from '../../utils/recipeImportExport';
import { useAuth } from '../../lib/AuthContext';
import type { Schema } from '../../amplify/data/resource';

type Recipe = Schema['Recipe']['type'];

interface RecipeImportExportProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (count: number) => void;
  recipes?: Recipe[];
}

export default function RecipeImportExport({
  visible,
  onClose,
  onImportSuccess,
  recipes = [],
}: RecipeImportExportProps) {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [importUrl, setImportUrl] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImportFromURL = async () => {
    if (!importUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Please sign in to import recipes');
      return;
    }

    setLoading(true);
    try {
      const recipe = await RecipeImportService.importFromURL(importUrl.trim());
      
      if (recipe) {
        const savedId = await RecipeImportService.saveImportedRecipe(recipe, session.user.id);
        
        if (savedId) {
          Alert.alert(
            'Success!',
            `Recipe "${recipe.name}" imported successfully!`,
            [{ text: 'OK' }]
          );
          onImportSuccess(1);
          setImportUrl('');
        } else {
          Alert.alert('Error', 'Failed to save imported recipe');
        }
      } else {
        Alert.alert('Error', 'No recipe found at this URL. The website may not be supported or the page may not contain recipe data.');
      }
    } catch (error: any) {
      Alert.alert('Import Error', error.message || 'Failed to import recipe');
    } finally {
      setLoading(false);
    }
  };

  const handleImportFromJSON = async () => {
    if (!jsonInput.trim()) {
      Alert.alert('Error', 'Please enter valid JSON recipe data');
      return;
    }

    if (!session?.user?.id) {
      Alert.alert('Error', 'Please sign in to import recipes');
      return;
    }

    setLoading(true);
    try {
      let importedRecipes;
      
      try {
        importedRecipes = await RecipeImportService.importFromJSON(jsonInput.trim());
      } catch {
        // Try parsing as plain text
        importedRecipes = TextRecipeParser.parseTextRecipe(jsonInput.trim());
      }

      if (importedRecipes.length === 0) {
        Alert.alert('Error', 'No valid recipes found in the provided data');
        return;
      }

      let successCount = 0;
      for (const recipe of importedRecipes) {
        try {
          const savedId = await RecipeImportService.saveImportedRecipe(recipe, session.user.id);
          if (savedId) successCount++;
        } catch (error) {
          console.error('Error saving recipe:', recipe.name, error);
        }
      }

      if (successCount > 0) {
        Alert.alert(
          'Success!',
          `${successCount} recipe${successCount > 1 ? 's' : ''} imported successfully!`,
          [{ text: 'OK' }]
        );
        onImportSuccess(successCount);
        setJsonInput('');
      } else {
        Alert.alert('Error', 'Failed to save any imported recipes');
      }
    } catch (error: any) {
      Alert.alert('Import Error', error.message || 'Failed to import recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportAll = async () => {
    if (recipes.length === 0) {
      Alert.alert('No Recipes', 'No recipes available to export');
      return;
    }

    setLoading(true);
    try {
      await RecipeExportService.exportRecipesToFile(recipes);
      Alert.alert('Success!', 'Recipes exported successfully!');
    } catch (error: any) {
      Alert.alert('Export Error', error.message || 'Failed to export recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSelected = async () => {
    // For now, export all recipes - in a full implementation, we'd have selection UI
    await handleExportAll();
  };

  const clearImportData = () => {
    setImportUrl('');
    setJsonInput('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.title}>Recipe Import & Export</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'import' && styles.activeTab]}
            onPress={() => setActiveTab('import')}
          >
            <Ionicons 
              name="download" 
              size={16} 
              color={activeTab === 'import' ? Colors.surface : Colors.primary} 
            />
            <Text style={[styles.tabText, activeTab === 'import' && styles.activeTabText]}>
              Import
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'export' && styles.activeTab]}
            onPress={() => setActiveTab('export')}
          >
            <Ionicons 
              name="share" 
              size={16} 
              color={activeTab === 'export' ? Colors.surface : Colors.primary} 
            />
            <Text style={[styles.tabText, activeTab === 'export' && styles.activeTabText]}>
              Export
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {activeTab === 'import' ? (
            <View style={styles.importSection}>
              {/* URL Import */}
              <View style={styles.importCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="link" size={20} color={Colors.primary} />
                  <Text style={styles.cardTitle}>Import from Website</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Paste a URL from popular recipe websites to automatically import the recipe
                </Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="https://example.com/recipe"
                    value={importUrl}
                    onChangeText={setImportUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline={false}
                  />
                  <TouchableOpacity
                    style={[styles.actionButton, !importUrl.trim() && styles.disabledButton]}
                    onPress={handleImportFromURL}
                    disabled={loading || !importUrl.trim()}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={Colors.surface} />
                    ) : (
                      <Ionicons name="download" size={16} color={Colors.surface} />
                    )}
                    <Text style={styles.actionButtonText}>
                      {loading ? 'Importing...' : 'Import'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.supportedSites}>
                  <Text style={styles.supportedSitesTitle}>Supported sites:</Text>
                  <Text style={styles.supportedSitesList}>
                    AllRecipes, Food Network, BBC Good Food, and any site with structured recipe data
                  </Text>
                </View>
              </View>

              {/* JSON/Text Import */}
              <View style={styles.importCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="document-text" size={20} color={Colors.secondary} />
                  <Text style={styles.cardTitle}>Import from Text/JSON</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Paste recipe text, JSON data, or exported recipe files
                </Text>
                
                <TextInput
                  style={styles.textArea}
                  placeholder="Paste recipe text or JSON data here..."
                  value={jsonInput}
                  onChangeText={setJsonInput}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
                
                <TouchableOpacity
                  style={[styles.actionButton, !jsonInput.trim() && styles.disabledButton]}
                  onPress={handleImportFromJSON}
                  disabled={loading || !jsonInput.trim()}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Ionicons name="add-circle" size={16} color={Colors.surface} />
                  )}
                  <Text style={styles.actionButtonText}>
                    {loading ? 'Processing...' : 'Import Recipes'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Clear Button */}
              {(importUrl || jsonInput) && (
                <TouchableOpacity style={styles.clearButton} onPress={clearImportData}>
                  <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
                  <Text style={styles.clearButtonText}>Clear All Fields</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.exportSection}>
              {/* Export Statistics */}
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Your Recipe Collection</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{recipes.length}</Text>
                    <Text style={styles.statLabel}>Total Recipes</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {recipes.filter(r => r.tags?.includes('imported')).length}
                    </Text>
                    <Text style={styles.statLabel}>Imported</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                      {new Set(recipes.map(r => r.category)).size}
                    </Text>
                    <Text style={styles.statLabel}>Categories</Text>
                  </View>
                </View>
              </View>

              {/* Export Options */}
              <View style={styles.exportCard}>
                <View style={styles.cardHeader}>
                  <Ionicons name="download" size={20} color={Colors.success} />
                  <Text style={styles.cardTitle}>Export All Recipes</Text>
                </View>
                <Text style={styles.cardDescription}>
                  Export all your recipes as a JSON file that can be imported later or shared
                </Text>
                
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={handleExportAll}
                  disabled={loading || recipes.length === 0}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.surface} />
                  ) : (
                    <Ionicons name="download" size={16} color={Colors.surface} />
                  )}
                  <Text style={styles.exportButtonText}>
                    {loading ? 'Exporting...' : `Export ${recipes.length} Recipes`}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Backup Tips */}
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Backup Tips</Text>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.tipText}>
                    Export regularly to backup your recipe collection
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.tipText}>
                    Exported files can be imported on any device with Culina
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.tipText}>
                    Share exported files with family and friends
                  </Text>
                </View>
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
  importSection: {
    gap: Spacing.lg,
  },
  importCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  cardDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: Typography.lineHeights.relaxed,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: Spacing.md,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.base,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: Spacing.md,
    minHeight: 120,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  disabledButton: {
    backgroundColor: Colors.textTertiary,
  },
  actionButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  supportedSites: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  supportedSitesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  supportedSitesList: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeights.relaxed,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  clearButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  exportSection: {
    gap: Spacing.lg,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  statsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  exportCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  exportButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.surface,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  tipsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: Typography.lineHeights.relaxed,
  },
});