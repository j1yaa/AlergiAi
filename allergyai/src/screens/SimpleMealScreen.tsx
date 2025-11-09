import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MEALS_KEY, MealEntry } from '../utils/mealStorage';

export default function SimpleMealScreen() {
  const [mealName, setMealName] = useState('');
  const [ingredientFields, setIngredientFields] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [riskStatus, setRiskStatus] = useState<'Safe' | 'Risk' | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const navigation = useNavigation();

  const checkRisk = (ingredientList: string[]): 'Safe' | 'Risk' => {
    const riskIngredients = ['peanut', 'peanuts', 'shrimp', 'crab', 'lobster', 'shellfish', 'wheat', 'milk', 'cheese', 'butter', 'yogurt', 'soy', 'egg', 'eggs'];
    
    return ingredientList.some(ingredient => 
      riskIngredients.some(risk => 
        ingredient.toLowerCase().includes(risk.toLowerCase())
      )
    ) ? 'Risk' : 'Safe';
  };

  const getIngredients = (): string[] => {
    return ingredientFields
      .map(i => i.trim())
      .filter(i => i.length > 0)
      .filter((item, index, arr) => arr.indexOf(item) === index); // Remove duplicates
  };

  const addIngredientField = () => {
    setIngredientFields([...ingredientFields, '']);
  };

  const removeIngredientField = (index: number) => {
    if (ingredientFields.length > 1) {
      const newFields = ingredientFields.filter((_, i) => i !== index);
      setIngredientFields(newFields);
    }
  };

  const updateIngredientField = (index: number, value: string) => {
    const newFields = [...ingredientFields];
    newFields[index] = value;
    setIngredientFields(newFields);
  };

  const handleAnalyze = () => {
    const trimmedName = mealName.trim();
    const ingredientList = getIngredients();

    if (!trimmedName && ingredientList.length === 0) {
      Alert.alert('Validation Error', 'Please enter meal name or ingredients');
      return;
    }

    setAnalyzing(true);
    const status = checkRisk(ingredientList);
    setRiskStatus(status);
    
    setTimeout(() => setAnalyzing(false), 500); // Brief loading for UX
  };

  const handleSave = async () => {
    const trimmedName = mealName.trim();
    const ingredientList = getIngredients();
    const trimmedNote = note.trim();

    if (!trimmedName && ingredientList.length === 0) {
      Alert.alert('Validation Error', 'Please enter meal name or ingredients');
      return;
    }
    
    setLoading(true);
    try {
      const riskIngredients = ['peanut', 'peanuts', 'shrimp', 'crab', 'lobster', 'shellfish', 'wheat', 'milk', 'cheese', 'butter', 'yogurt', 'soy', 'egg', 'eggs'];
      const hasRisk = ingredientList.some(ingredient => 
        riskIngredients.some(risk => 
          ingredient.toLowerCase().includes(risk.toLowerCase())
        )
      );
      
      const meal: MealEntry = {
        id: `meal-${Date.now()}`,
        name: trimmedName || 'Unnamed Meal',
        ingredients: ingredientList,
        riskScore: hasRisk ? 75 : 25,
        note: trimmedNote || undefined,
        createdAt: new Date().toISOString()
      };
      
      const existingMeals = await AsyncStorage.getItem(MEALS_KEY);
      const meals = existingMeals ? JSON.parse(existingMeals) : [];
      meals.unshift(meal);
      await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(meals));
      
      Alert.alert('Success', 'Meal logged successfully');
      setMealName('');
      setIngredientFields(['']);
      setNote('');
      setRiskStatus(null);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Meal Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter meal name..."
          value={mealName}
          onChangeText={setMealName}
          returnKeyType="next"
          accessibilityLabel="Meal name input"
        />
        
        <Text style={styles.label}>Ingredients</Text>
        {ingredientFields.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.input, styles.ingredientInput]}
              placeholder={`Ingredient ${index + 1}`}
              value={ingredient}
              onChangeText={(value) => updateIngredientField(index, value)}
              returnKeyType="next"
              accessibilityLabel={`Ingredient ${index + 1} input`}
            />
            {ingredientFields.length > 1 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeIngredientField(index)}
                accessibilityLabel={`Remove ingredient ${index + 1}`}
              >
                <Text style={styles.removeButtonText}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={addIngredientField}
          accessibilityLabel="Add another ingredient"
        >
          <Text style={styles.addButtonText}>➕ Add Another Item</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Afternoon snack, Dinner with friends..."
          value={note}
          onChangeText={setNote}
          returnKeyType="done"
          accessibilityLabel="Meal note input"
        />

        <TouchableOpacity 
          style={styles.analyzeButton}
          onPress={handleAnalyze}
          disabled={analyzing || (!mealName.trim() && getIngredients().length === 0)}
        >
          {analyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.analyzeButtonText}>🔍 Analyze Risk</Text>
          )}
        </TouchableOpacity>

        {getIngredients().length > 0 && (
          <View style={styles.ingredientsContainer}>
            <Text style={styles.sectionTitle}>Ingredients:</Text>
            <View style={styles.pillContainer}>
              {getIngredients().map((ingredient, index) => (
                <View key={index} style={styles.pill}>
                  <Text style={styles.pillText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {riskStatus && (
          <View style={styles.riskContainer}>
            <View style={[styles.riskBadge, { backgroundColor: riskStatus === 'Safe' ? '#4CAF50' : '#E53935' }]}>
              <Text style={styles.riskText}>{riskStatus}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading || (!mealName.trim() && getIngredients().length === 0)}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Meal</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ingredientInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeButton: {
    marginLeft: 12,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 18,
    color: '#E53935',
  },
  addButton: {
    backgroundColor: '#F5F5F7',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#000',
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    color: '#000',
    fontSize: 14,
  },
  riskContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  riskText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});