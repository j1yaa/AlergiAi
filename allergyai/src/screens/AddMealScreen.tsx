import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeMeal, createMeal } from '../api/client';
import { AnalyzeResponse } from '../types';
import { Ionicons } from '@expo/vector-icons';

export default function AddMealScreen() {
  const navigation = useNavigation();
  const [mealName, setMealName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
      navigation.goBack();
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert('Error', 'Could not save the meal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Meal</Text>

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
});