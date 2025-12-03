import React, { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeMeal, createMeal, getMeals, deleteMeal } from '../api/client';
import { AnalyzeResponse, Meal } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function AddMealScreen() {
  const navigation = useNavigation();
  const [mealName, setMealName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  const handleAnalyze = async () => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      const response = await analyzeMeal({ description });
      setResult(response);
      console.log('Analysis complete, mealName still:', mealName);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeals = async () => {
    setLoadingMeals(true);
    try {
      const mealsData = await getMeals();
      setMeals(mealsData);
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleViewHistory = async () => {
    setShowHistory(true);
    await loadMeals();
  };

  const formatDate = (meal: Meal) => {
    let date: Date;
    if (meal.createdAt) {
      date = new Date(meal.createdAt);
    } else if (meal.timeStamp) {
      date = meal.timeStamp;
    } else if (meal.dateISO) {
      date = new Date(meal.dateISO);
    } else {
      date = new Date();
    }
    
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteMeal = async (mealId: string, mealName: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${mealName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting meal:', mealId);
              await deleteMeal(mealId);
              console.log('Meal deleted successfully, reloading meals...');
              await loadMeals();
              Alert.alert('Success', 'Meal deleted successfully');
            } catch (error) {
              console.error('Delete meal error:', error);
              Alert.alert('Error', 'Failed to delete meal');
            }
          }
        }
      ]
    );
  };

  const renderMeal = ({ item }: { item: Meal }) => {
    const mealName = item.note || item.notes || item.description || 'Unnamed Meal';
    
    return (
      <View style={styles.mealCard}>
        <View style={styles.mealHeader}>
          <Text style={styles.mealName}>{mealName}</Text>
          <TouchableOpacity 
            onPress={() => handleDeleteMeal(item.id, mealName)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.mealDate}>{formatDate(item)}</Text>
        
        {item.items && item.items.length > 0 && (
          <View style={styles.mealIngredientsContainer}>
            <Text style={styles.mealIngredientsLabel}>Ingredients:</Text>
            <View style={styles.mealIngredientsList}>
              {item.items.map((ingredient, index) => (
                <View key={index} style={styles.mealIngredientPill}>
                  <Text style={styles.mealIngredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleSave = async () => {
    const nameFromName = (mealName ?? '').trim();
    const nameFromDesc = (description ?? '').trim();
    const finalName = nameFromName || nameFromDesc;
    
    const ing = Array.isArray(result?.ingredients)
      ? result.ingredients
      : (description ?? '').split(',').map(i => i.trim()).filter(Boolean);

    if (!finalName && ing.length === 0) {
      Alert.alert('Missing Information', 'Please enter a meal name, description, or at least one ingredient.');
      return;
    }

    setSaving(true);
    try {
      await createMeal({
        items: ing,
        note: finalName || 'Unnamed Meal'
      });

      Alert.alert('Saved', 'Your meal was logged.');
      setMealName('');
      setDescription('');
      setResult(null);
      // Refresh meals list if history is currently shown
      if (showHistory) {
        loadMeals();
      }
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Error', 'Could not save the meal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Meal</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={handleViewHistory}
        >
          <Ionicons name="time-outline" size={18} color="#2196F3" />
          <Text style={styles.historyButtonText}>View History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Meal Name</Text>
      <TextInput
        style={styles.input}
        value={mealName}
        onChangeText={(text) => {
          console.log('TextInput onChange:', `"${text}"`);
          setMealName(text);
        }}
        placeholder="Enter meal name..."
        testID="mealNameInput"
      />

      {/* Scan Button Card */}
      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => navigation.navigate('Scanner' as never)}
      >
        <View style={styles.scanIconContainer}>
          <Ionicons name="scan" size={32} color="#2196F3" />
        </View>
        <View style={styles.scanTextContainer}>
          <Text style={styles.scanTitle}>📷 Scan Food Label</Text>
          <Text style={styles.scanSubtitle}>Quick allergen detection with camera</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#999" />
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Describe your meal..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleAnalyze}
        disabled={loading || !description.trim()}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Analyzing...' : 'Analyze Meal'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Saving...' : 'Save Meal'}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analysis Result</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients:</Text>
            <View style={styles.pillContainer}>
              {result.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.pill}>
                  <Text style={styles.pillText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergens:</Text>
            <View style={styles.pillContainer}>
              {result.allergens.length > 0 ? (
                result.allergens.map((allergen, index) => (
                  <View key={index} style={[styles.pill, styles.allergenPill]}>
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noAllergens}>No allergens detected</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Risk Score: {result.riskScore}/100</Text>
            <View style={[styles.riskBar, { backgroundColor: result.riskScore > 50 ? '#FF6B6B' : '#4CAF50' }]}>
              <View style={[styles.riskFill, { width: `${result.riskScore}%` }]} />
            </View>
          </View>

          <Text style={styles.advice}>{result.advice}</Text>
        </View>
      )}

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Meal History</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowHistory(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {loadingMeals ? (
            <View style={styles.loadingContainer}>
              <Text>Loading meals...</Text>
            </View>
          ) : meals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No meals logged yet</Text>
              <Text style={styles.emptySubtext}>Start tracking your meals to monitor allergen exposure</Text>
            </View>
          ) : (
            <FlatList
              data={meals}
              renderItem={renderMeal}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mealsList}
            />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: '#2e7d32',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    color: '#1976d2',
    fontSize: 14,
  },
  allergenPill: {
    backgroundColor: '#ffebee',
  },
  allergenText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  noAllergens: {
    color: '#4caf50',
    fontStyle: 'italic',
  },
  riskBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  advice: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#666',
    marginTop: 10,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  scanIconContainer: {
    marginRight: 15,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  historyButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  mealsList: {
    padding: 20,
  },
  mealCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  mealIngredientsContainer: {
    marginTop: 8,
  },
  mealIngredientsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  mealIngredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mealIngredientPill: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
    marginBottom: 4,
  },
  mealIngredientText: {
    color: '#1976d2',
    fontSize: 11,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
  },
});