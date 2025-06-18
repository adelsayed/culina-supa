// Recipe Add Screen - Professional Form
import React, { useState } from 'react';
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

export default function AddRecipeScreen() {
  const params = useLocalSearchParams();
  
  const [title, setTitle] = useState(params.title as string || '');
  const [description, setDescription] = useState(params.description as string || '');
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState(() => {
    if (params.ingredients) {
      // Convert AI recipe ingredients format to app format
      return (params.ingredients as string).split('\n').map(ingredient => ({
        name: ingredient.trim(),
        quantity: '',
        unit: ''
      }));
    }
    return [{ name: '', quantity: '', unit: '' }];
  });
  const [instructions, setInstructions] = useState(() => {
    if (params.instructions) {
      // Convert AI recipe instructions format to app format
      return (params.instructions as string).split('\n').map(instruction => instruction.trim());
    }
    return [''];
  });
  const [category, setCategory] = useState(params.category as string || '');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  const unitOptions = [
    '', 'g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'can', 'packet', 'slice', 'clove', 'oz', 'lb'
  ];
  const categoryOptions = [
    '', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert', 'Beverage', 'Other'
  ];

  const { session } = useAuth();
  const router = useRouter();

  // Image picker with upload
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
      const key = `users/${userId}/recipes/${recipeId}/${fileName}`;
      
      const result = await uploadData({
        key,
        data: blob,
        options: {
          bucket: 'recipe-images'
        }
      }).result;
      
      // Return the actual S3 URL - need to construct it properly
      const bucketName = 'amplify-supaouth-adelsaye-recipeimagesbucketbb070a-gp8yhpe7lizi';
      const region = 'me-south-1';
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    } catch (error) {
      return null;
    }
  };

  // Video picker
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideo(result.assets[0].uri);
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

  // Submit handler with image upload
  const handleSubmit = async () => {
    if (!title.trim() || ingredients.length === 0 || !ingredients[0].name.trim() || instructions.length === 0 || !instructions[0].trim()) {
      Alert.alert('Validation Error', 'Title, at least one ingredient, and one instruction are required.');
      return;
    }
    if (!session?.user?.id) {
      Alert.alert('Error', 'You must be signed in to add a recipe.');
      return;
    }
    setLoading(true);
    try {
      // First create the recipe to get an ID
      const recipe = await (amplifyClient.models as any).Recipe.create({
        name: title.trim(),
        imageUrl: '', // Will update after image upload
        ingredients: JSON.stringify(ingredients),
        instructions: JSON.stringify(instructions),
        category: category.trim(),
        tags: tags
          .split(',')
          .map(t => {
            const tag = t.trim();
            return tag.length > 0 ? tag : null;
          }),
        userId: session.user.id,
      });

      let finalImageUrl = '';
      
      // Upload image if one was selected
      if (image && recipe.data?.id) {
        const uploadedUrl = await uploadImageToS3(image, session.user.id, recipe.data.id);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          // Update recipe with the S3 image URL
          await (amplifyClient.models as any).Recipe.update({
            id: recipe.data.id,
            imageUrl: finalImageUrl
          });
        }
      }

      setLoading(false);
      Alert.alert('Success', 'Recipe created!');
      router.back();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save recipe.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.header}>Add Recipe</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </View>

      {/* Basic Info */}
      <Text style={styles.section}>Basic Info</Text>
      <TextInput
        style={styles.input}
        placeholder="Title *"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, { height: 60 }]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Media */}
      <Text style={styles.section}>Media</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
          <Ionicons name="image" size={24} color="#007AFF" />
          <Text style={{ marginLeft: 8 }}>Add Image</Text>
        </TouchableOpacity>
        {image && <Image source={{ uri: image }} style={styles.previewImg} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo}>
          <Ionicons name="videocam" size={24} color="#007AFF" />
          <Text style={{ marginLeft: 8 }}>Add Video</Text>
        </TouchableOpacity>
        {video && <Ionicons name="checkmark-circle" size={24} color="#4CD964" style={{ marginLeft: 8 }} />}
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
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Recipe</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  section: { fontSize: 18, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 10, backgroundColor: '#fafbfc' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginRight: 12 },
  previewImg: { width: 48, height: 48, borderRadius: 8, marginLeft: 8 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  cancelText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#007AFF80',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
});