// Recipe Edit Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import ModalSelector from 'react-native-modal-selector';
import { amplifyClient, getGuestCredentials } from '../../lib/amplify';
import { useAuth } from '../../lib/AuthContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { uploadData } from 'aws-amplify/storage';
import type { Schema } from '../../amplify/data/resource';

type Recipe = Schema['Recipe'];

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState([{ name: '', quantity: '', unit: '' }]);
  const [instructions, setInstructions] = useState(['']);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const unitOptions = [
    '', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'can', 'packet', 'slice', 'clove', 'oz', 'lb'
  ];
  const categoryOptions = [
    '', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage', 'Other'
  ];

  // Load existing recipe data
  useEffect(() => {
    const loadRecipe = async () => {
      if (!session?.user?.id || !id) {
        Alert.alert('Error', 'Invalid recipe or user session');
        router.back();
        return;
      }

      try {
        // Check if Amplify models are available
        if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
          console.log('⚠️ Amplify Recipe model not available');
          setError('Recipe backend not configured');
          setLoading(false);
          return;
        }
        
        const result = await (amplifyClient.models as any).Recipe.get({ id: id as string });
        if (result.data) {
          const recipeData = result.data;
          setRecipe(recipeData);
          setTitle(recipeData.name || '');
          setImage(recipeData.imageUrl || null);
          setCategory(recipeData.category || '');
          
          // Parse ingredients and instructions with error handling
          console.log('Raw ingredients from DB:', recipeData.ingredients);
          let parsedIngredients;
          try {
            parsedIngredients = recipeData.ingredients ? JSON.parse(recipeData.ingredients) : [{ name: '', quantity: '', unit: '' }];
          } catch (error) {
            console.log('Failed to parse ingredients as JSON, treating as plain text');
            // If JSON parsing fails, treat as plain text and split by lines
            parsedIngredients = recipeData.ingredients
              ? recipeData.ingredients.split('\n').filter(Boolean).map((ing: string) => ({ name: ing.trim(), quantity: '', unit: '' }))
              : [{ name: '', quantity: '', unit: '' }];
          }
          console.log('Parsed ingredients:', parsedIngredients);
          
          // Parse ingredient string into quantity, unit, and name
          const parseIngredientString = (ingredientStr: string) => {
            // Common units to look for
            const units = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'piece', 'pieces', 'can', 'cans', 'packet', 'packets', 'slice', 'slices', 'clove', 'cloves', 'oz', 'lb', 'lbs'];
            
            // Match patterns like "6 cups", "200g", "1/2 cup", "2 tbsp", etc.
            const match = ingredientStr.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*(g|kg|ml|l|cup|cups|tbsp|tsp|piece|pieces|can|cans|packet|packets|slice|slices|clove|cloves|oz|lb|lbs)?\s*(.+)$/i);
            
            if (match) {
              const quantity = match[1];
              const unit = match[2] || '';
              const name = match[3].trim();
              return { quantity, unit, name };
            }
            
            // If no match, put everything in name
            return { quantity: '', unit: '', name: ingredientStr };
          };

          // Handle both string array format (from dummy data) and object format
          let formattedIngredients;
          if (Array.isArray(parsedIngredients)) {
            if (parsedIngredients.length > 0 && typeof parsedIngredients[0] === 'string') {
              // Convert string array to object format with smart parsing
              formattedIngredients = parsedIngredients.map(ingredient => parseIngredientString(ingredient));
            } else if (parsedIngredients.length > 0 && typeof parsedIngredients[0] === 'object') {
              // Already in object format
              formattedIngredients = parsedIngredients;
            } else {
              formattedIngredients = [{ name: '', quantity: '', unit: '' }];
            }
          } else {
            formattedIngredients = [{ name: '', quantity: '', unit: '' }];
          }
          
          console.log('Formatted ingredients:', formattedIngredients);
          setIngredients(formattedIngredients);
          
          // Parse instructions with error handling
          let parsedInstructions;
          try {
            parsedInstructions = recipeData.instructions ? JSON.parse(recipeData.instructions) : [''];
          } catch (error) {
            console.log('Failed to parse instructions as JSON, treating as plain text');
            // If JSON parsing fails, treat as plain text and split by lines
            parsedInstructions = recipeData.instructions
              ? recipeData.instructions.split('\n').filter(Boolean)
              : [''];
          }
          setInstructions(Array.isArray(parsedInstructions) ? parsedInstructions : ['']);
          
          // Handle tags
          if (recipeData.tags) {
            setTags(Array.isArray(recipeData.tags) ? recipeData.tags.join(', ') : '');
          }
        } else {
          Alert.alert('Error', 'Recipe not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load recipe');
        router.back();
      } finally {
        setLoadingRecipe(false);
      }
    };

    loadRecipe();
  }, [id, session?.user?.id]);

  // Image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // Upload image to S3
  const uploadImageToS3 = async (imageUri: string, userId: string, recipeId: string): Promise<string | null> => {
    try {
      // Ensure we have guest credentials
      await getGuestCredentials();
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const fileName = `main-image.jpg`;
      const key = `public/users/${userId}/recipes/${recipeId}/${fileName}`;
      
      const result = await uploadData({
        key,
        data: blob,
        options: {
          bucket: 'recipe-images',
          contentType: 'image/jpeg'
        }
      }).result;
      
      // Return the actual S3 URL - need to construct it properly
      const bucketName = 'amplify-supaouth-adelsaye-recipeimagesbucketbb070a-gp8yhpe7lizi';
      const region = 'me-south-1';
      // Add cache-busting query param
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}?t=${Date.now()}`;
    } catch (error) {
      return null;
    }
  };

  // Ingredient handlers
  const updateIngredient = (idx: number, key: string, value: string) => {
    const updated = ingredients.map((ing, i) =>
      i === idx ? { ...ing, [key]: value } : ing
    );
    setIngredients(updated);
  };
  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  const removeIngredient = (idx: number) => setIngredients(ingredients.filter((_, i) => i !== idx));

  // Instruction handlers
  const updateInstruction = (idx: number, value: string) => {
    const updated = instructions.map((step, i) => (i === idx ? value : step));
    setInstructions(updated);
  };
  const addInstruction = () => setInstructions([...instructions, '']);
  const removeInstruction = (idx: number) => setInstructions(instructions.filter((_, i) => i !== idx));

  // Submit handler
  const handleSubmit = async () => {
    if (!title.trim() || ingredients.length === 0 || !ingredients[0].name.trim() || instructions.length === 0 || !instructions[0].trim()) {
      Alert.alert('Validation Error', 'Title, at least one ingredient, and one instruction are required.');
      return;
    }
    if (!session?.user?.id || !recipe?.id) {
      Alert.alert('Error', 'Invalid session or recipe ID');
      return;
    }
    
    setLoading(true);
    try {
      let finalImageUrl = recipe.imageUrl || '';
      
      // Upload new image if one was selected and it's not the existing URL
      if (image && image !== recipe.imageUrl && !image.startsWith('https://')) {
        const uploadedUrl = await uploadImageToS3(image, session.user.id, recipe.id);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      // Update recipe
      // Check if Amplify models are available
      if (!amplifyClient?.models || !(amplifyClient.models as any).Recipe) {
        setError('Recipe backend not configured');
        return;
      }
      
      await (amplifyClient.models as any).Recipe.update({
        id: recipe.id,
        name: title.trim(),
        imageUrl: finalImageUrl,
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        category: category.trim(),
        tags: tags
          .split(',')
          .map(t => {
            const tag = t.trim();
            return tag.length > 0 ? tag : null;
          }),
      });

      setLoading(false);
      Alert.alert('Success', `Recipe updated!\nImage URL:\n${finalImageUrl}`);
      router.back();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to update recipe.');
    }
  };

  if (loadingRecipe) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading recipe...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.header}>Edit Recipe</Text>

      {/* Basic Info */}
      <Text style={styles.section}>Basic Info</Text>
      <TextInput
        style={styles.input}
        placeholder="Title *"
        value={title}
        onChangeText={setTitle}
      />

      {/* Media */}
      <Text style={styles.section}>Media</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#007AFF" />
          <Text style={{ marginLeft: 8 }}>Change Image</Text>
        </TouchableOpacity>
        <Image
          source={{
            uri:
              image ||
              'https://amplify-supaouth-adelsaye-recipeimagesbucketbb070a-gp8yhpe7lizi.s3.me-south-1.amazonaws.com/public/users/4cbcaace-94ef-4796-9ebd-04a5d5038583/recipes/61774c2a-84ce-42f7-ab7c-6af33ae1dcb0/main-image.jpg'
          }}
          style={styles.previewImg}
        />
      </View>

      {/* Ingredients */}
      <Text style={styles.section}>Ingredients</Text>
      {ingredients.map((ing, idx) => (
        <View key={idx} style={styles.ingredientRow}>
          <TextInput
            style={[styles.input, { flex: 2 }]}
            placeholder="Ingredient *"
            value={ing.name}
            onChangeText={text => updateIngredient(idx, 'name', text)}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginLeft: 6 }]}
            placeholder="Qty"
            value={ing.quantity}
            onChangeText={text => updateIngredient(idx, 'quantity', text)}
          />
          <View style={[styles.input, { flex: 1, marginLeft: 6, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center' }]}>
            <ModalSelector
              data={unitOptions.map(option => ({
                key: option,
                label: option ? option : 'Unit',
                value: option
              }))}
              initValue="Unit"
              onChange={option => updateIngredient(idx, 'unit', option.value)}
              style={{ height: 36, justifyContent: 'center' }}
              selectStyle={{ borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 0, paddingRight: 0 }}
              selectTextStyle={{ fontSize: 14, color: '#333' }}
              optionTextStyle={{ fontSize: 16 }}
              cancelText="Cancel"
            >
              <Text style={{ fontSize: 14, color: ing.unit ? '#333' : '#888' }}>
                {ing.unit || 'Unit'}
              </Text>
            </ModalSelector>
          </View>
          <TouchableOpacity onPress={() => removeIngredient(idx)} disabled={ingredients.length === 1}>
            <Ionicons name="remove-circle" size={24} color={ingredients.length === 1 ? "#ccc" : "#FF3B30"} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
        <Ionicons name="add-circle" size={20} color="#007AFF" />
        <Text style={{ marginLeft: 6 }}>Add Ingredient</Text>
      </TouchableOpacity>

      {/* Instructions */}
      <Text style={styles.section}>Instructions</Text>
      {instructions.map((step, idx) => (
        <View key={idx} style={styles.ingredientRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder={`Step ${idx + 1} *`}
            value={step}
            onChangeText={text => updateInstruction(idx, text)}
            multiline
          />
          <TouchableOpacity onPress={() => removeInstruction(idx)} disabled={instructions.length === 1}>
            <Ionicons name="remove-circle" size={24} color={instructions.length === 1 ? "#ccc" : "#FF3B30"} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={addInstruction}>
        <Ionicons name="add-circle" size={20} color="#007AFF" />
        <Text style={{ marginLeft: 6 }}>Add Step</Text>
      </TouchableOpacity>

      {/* Category & Tags */}
      <Text style={styles.section}>Category & Tags</Text>
      <View style={[styles.input, { marginBottom: 10, paddingHorizontal: 0, paddingVertical: 0, justifyContent: 'center' }]}>
        <ModalSelector
          data={categoryOptions.map(option => ({
            key: option,
            label: option ? option : 'Select Category',
            value: option
          }))}
          initValue="Select Category"
          onChange={option => setCategory(option.value)}
          style={{ height: 36, justifyContent: 'center' }}
          selectStyle={{ borderWidth: 0, backgroundColor: 'transparent', paddingLeft: 0, paddingRight: 0 }}
          selectTextStyle={{ fontSize: 14, color: '#333' }}
          optionTextStyle={{ fontSize: 16 }}
          cancelText="Cancel"
        >
          <Text style={{ fontSize: 14, color: category ? '#333' : '#888' }}>
            {category || 'Select Category'}
          </Text>
        </ModalSelector>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Tags (comma separated)"
        value={tags}
        onChangeText={setTags}
      />

      {/* Actions */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Update Recipe</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fafbfc' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 12 },
  previewImg: { width: 48, height: 48, borderRadius: 8, marginLeft: 8 },
  submitBtn: { backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});