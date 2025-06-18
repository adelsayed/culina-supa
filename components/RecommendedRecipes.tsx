import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useUserProfile } from '../hooks/useUserProfile';
import { getPersonalizedRecipesAI, getPersonalizedRecipesLocal } from '../utils/personalizedRecommendations';
import { amplifyClient } from '../lib/amplify';

export default function RecommendedRecipes({ maxResults = 10 }: { maxResults?: number }) {
  const { profile } = useUserProfile();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all recipes
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    amplifyClient.models.Recipe.list().then(({ data }) => {
      if (mounted) {
        setRecipes(data || []);
        setLoading(false);
      }
    }).catch(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  // Get recommendations when profile or recipes change
  useEffect(() => {
    if (!profile || recipes.length === 0) {
      setRecommendations([]);
      return;
    }
    setError(null);
    setRecommendations([]); // Clear first
    
    // Use setTimeout to ensure state is cleared before setting new recommendations
    setTimeout(() => {
      const uniqueRecommendations = getPersonalizedRecipesLocal(profile, recipes, maxResults);
      setRecommendations(uniqueRecommendations);
    }, 10);
  }, [profile, recipes, maxResults]);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <Text style={styles.emptyText}>No personalized recipes found. Try updating your preferences!</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended for You</Text>
      {aiLoading && (
        <Text style={styles.aiText}>Using AI for recommendations...</Text>
      )}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {/* Debug section to see recipe IDs and names */}
      <View style={styles.debugSection}>
        <Text style={styles.debugTitle}>Debug: Recommended Recipe IDs/Names</Text>
        {recommendations.map((recipe, index) => (
          <Text key={`debug-${recipe.id}`} style={styles.debugText}>
            {index + 1}. ID: {recipe.id} | Name: {recipe.name}
          </Text>
        ))}
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {recommendations.map((recipe, index) => (
          <TouchableOpacity key={`recipe-${recipe.id}-${index}`} style={styles.card}>
            {recipe.imageUrl ? (
              <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
            ) : (
              <View style={styles.placeholder}><Text>🍽️</Text></View>
            )}
            <Text style={styles.recipeName} numberOfLines={2}>{recipe.name}</Text>
            {recipe.calories && (
              <Text style={styles.recipeMeta}>{Math.round(recipe.calories)} kcal</Text>
            )}
            {recipe.category && (
              <Text style={styles.recipeMeta}>{recipe.category}</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  aiText: {
    color: '#007AFF',
    fontSize: 13,
    marginBottom: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginBottom: 4,
  },
  scroll: {
    flexDirection: 'row',
  },
  card: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  image: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  placeholder: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  recipeName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  recipeMeta: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  debugSection: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});