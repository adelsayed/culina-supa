import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAmplifyClient } from '../lib/amplify';
import type { Schema } from '../amplify/data/resource';
import { useAuth } from '../lib/AuthContext';

type Recipe = Schema['Recipe']['type'];
type MealType = 'breakfast' | 'snack1' | 'lunch' | 'snack2' | 'dinner';

interface RecipePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe, servings: number) => void;
  mealType: MealType;
  selectedDate: Date;
}

const RecipePicker: React.FC<RecipePickerProps> = ({
  visible,
  onClose,
  onSelectRecipe,
  mealType,
  selectedDate,
}) => {
  const { session } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(1);

  useEffect(() => {
    if (visible && session) {
      loadRecipes();
    }
  }, [visible, session]);

  const loadRecipes = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const client = getAmplifyClient();
      const { data } = await client.models.Recipe.list({
        filter: { userId: { eq: session.user.id } }
      });
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMealTypeDisplayName = (type: MealType): string => {
    const names = {
      breakfast: 'Breakfast',
      snack1: 'Morning Snack',
      lunch: 'Lunch',
      snack2: 'Afternoon Snack',
      dinner: 'Dinner',
    };
    return names[type];
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleConfirmSelection = () => {
    if (selectedRecipe) {
      onSelectRecipe(selectedRecipe, servings);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedRecipe(null);
    setServings(1);
    setSearchQuery('');
    onClose();
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const isSelected = selectedRecipe?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.recipeItem, isSelected && styles.selectedRecipeItem]}
        onPress={() => handleSelectRecipe(item)}
      >
        <View style={styles.recipeImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
          ) : (
            <View style={[styles.recipeImage, styles.placeholderImage]}>
              <Ionicons name="restaurant-outline" size={24} color="#ccc" />
            </View>
          )}
        </View>
        
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{item.name}</Text>
          {item.category && (
            <Text style={styles.recipeCategory}>{item.category}</Text>
          )}
          
          <View style={styles.recipeStats}>
            {item.calories && (
              <Text style={styles.recipeStat}>{String(Math.round(item.calories))} cal</Text>
            )}
            {item.prepTime && (
              <Text style={styles.recipeStat}>{String(item.prepTime)}min prep</Text>
            )}
            {item.difficulty && (
              <Text style={[styles.recipeStat, styles.difficulty]}>
                {String(item.difficulty)}
              </Text>
            )}
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#34C759" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Add Recipe</Text>
            <Text style={styles.headerSubtitle}>
              {getMealTypeDisplayName(mealType)} • {selectedDate.toLocaleDateString()}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={handleConfirmSelection}
            disabled={!selectedRecipe}
            style={[styles.confirmButton, !selectedRecipe && styles.disabledButton]}
          >
            <Text style={[styles.confirmButtonText, !selectedRecipe && styles.disabledText]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>

        {/* Servings Selector (when recipe is selected) */}
        {selectedRecipe && (
          <View style={styles.servingsContainer}>
            <Text style={styles.servingsLabel}>Servings:</Text>
            <View style={styles.servingsControls}>
              <TouchableOpacity
                onPress={() => setServings(Math.max(0.5, servings - 0.5))}
                style={styles.servingsButton}
              >
                <Ionicons name="remove" size={20} color="#007AFF" />
              </TouchableOpacity>
              
              <Text style={styles.servingsValue}>{servings}</Text>
              
              <TouchableOpacity
                onPress={() => setServings(servings + 0.5)}
                style={styles.servingsButton}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recipe List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading recipes...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            style={styles.recipeList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>No recipes found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Try a different search term' : 'Create your first recipe to get started'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  servingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  servingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  servingsControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  servingsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center',
  },
  recipeList: {
    flex: 1,
  },
  recipeItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedRecipeItem: {
    backgroundColor: '#f0f8ff',
    borderBottomColor: '#007AFF',
  },
  recipeImageContainer: {
    marginRight: 12,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipeCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  recipeStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeStat: {
    fontSize: 12,
    color: '#999',
    marginRight: 12,
    marginBottom: 2,
  },
  difficulty: {
    textTransform: 'capitalize',
  },
  selectedIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default RecipePicker;