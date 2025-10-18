import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { analyzeMeal } from '../api/client';
import { AnalyzeResponse } from '../types';

export default function AddMealScreen() {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    try {
      const response = await analyzeMeal({ description });
      setResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Meal</Text>
      
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
});