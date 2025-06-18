import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo', 'Low-Carb', 'Gluten-Free', 'Dairy-Free', 'Halal', 'Kosher'
];
const ALLERGY_OPTIONS = [
  'Nuts', 'Shellfish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Fish', 'Sesame'
];
const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Middle Eastern', 'Indian', 'French', 'American', 'Mediterranean', 'Japanese', 'Chinese'
];

export default function DietaryPreferencesSection({ profile, updateProfile }: any) {
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState<string[]>([]);
  const [preferredCuisines, setPreferredCuisines] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [customDislike, setCustomDislike] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDietaryRestrictions(profile?.dietaryRestrictions || []);
    setAllergies(profile?.allergies || []);
    setDislikedIngredients(profile?.dislikedIngredients || []);
    setPreferredCuisines(profile?.preferredCuisines || []);
  }, [profile]);

  const toggleItem = (arr: string[], setArr: (a: string[]) => void, value: string) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const handleAddCustom = (arr: string[], setArr: (a: string[]) => void, value: string, setValue: (v: string) => void) => {
    if (value && !arr.includes(value)) {
      setArr([...arr, value]);
      setValue('');
    }
  };

  const handleRemove = (arr: string[], setArr: (a: string[]) => void, value: string) => {
    setArr(arr.filter((v) => v !== value));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({
        dietaryRestrictions,
        allergies,
        dislikedIngredients,
        preferredCuisines,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // handle error
    }
    setSaving(false);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Dietary Preferences</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {DIETARY_OPTIONS.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, dietaryRestrictions.includes(option) && styles.chipSelected]}
            onPress={() => toggleItem(dietaryRestrictions, setDietaryRestrictions, option)}
          >
            <Text style={[styles.chipText, dietaryRestrictions.includes(option) && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.label}>Allergies</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {ALLERGY_OPTIONS.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, allergies.includes(option) && styles.chipSelected]}
            onPress={() => toggleItem(allergies, setAllergies, option)}
          >
            <Text style={[styles.chipText, allergies.includes(option) && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
        {allergies.map(option => (
          !ALLERGY_OPTIONS.includes(option) && (
            <TouchableOpacity
              key={option}
              style={[styles.chip, styles.chipCustom]}
              onPress={() => handleRemove(allergies, setAllergies, option)}
            >
              <Text style={styles.chipText}>{option} ✕</Text>
            </TouchableOpacity>
          )
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={customAllergy}
          onChangeText={setCustomAllergy}
          placeholder="Add custom allergy"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddCustom(allergies, setAllergies, customAllergy, setCustomAllergy)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Disliked Ingredients</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {dislikedIngredients.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, styles.chipCustom]}
            onPress={() => handleRemove(dislikedIngredients, setDislikedIngredients, option)}
          >
            <Text style={styles.chipText}>{option} ✕</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={customDislike}
          onChangeText={setCustomDislike}
          placeholder="Add disliked ingredient"
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddCustom(dislikedIngredients, setDislikedIngredients, customDislike, setCustomDislike)}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Preferred Cuisines</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CUISINE_OPTIONS.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, preferredCuisines.includes(option) && styles.chipSelected]}
            onPress={() => toggleItem(preferredCuisines, setPreferredCuisines, option)}
          >
            <Text style={[styles.chipText, preferredCuisines.includes(option) && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Preferences'}</Text>
        </TouchableOpacity>
        {saved && <Text style={styles.successText}>Preferences saved!</Text>}
      </View>
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
    marginBottom: 16,
  },
  chipScroll: {
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipCustom: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  saveContainer: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
});