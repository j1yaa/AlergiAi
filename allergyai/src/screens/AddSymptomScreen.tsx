import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { saveSymptom } from '../api/client';

export default function AddSymptomScreen() {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    
    setLoading(true);
    try {
      const symptom = {
        description: description.trim(),
        severity,
        dateISO: new Date().toISOString()
      };
      
      await saveSymptom(symptom);
      setDescription('');
      setSeverity(3);
      Alert.alert('Success', 'Symptom logged successfully');
    } catch (error) {
      console.error('Failed to save symptom:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', 'Failed to save symptom. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>Log Symptom</ThemedText>
      
      <TextInput
        style={styles.input}
        placeholder="Describe your symptom..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.severityContainer}>
        <ThemedText style={styles.label}>Severity (1-5)</ThemedText>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={severity}
          onValueChange={setSeverity}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#D1D1D1"
          thumbTintColor="#2196F3"
        />
        <View style={styles.severityLabels}>
          <ThemedText>Mild</ThemedText>
          <ThemedText style={styles.severityValue}>{severity}</ThemedText>
          <ThemedText>Severe</ThemedText>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleSave}
        disabled={loading || description.trim().length === 0}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Saving...' : 'Save Symptom'}
        </Text>
      </TouchableOpacity>
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
    minHeight: 120,
  },
  severityContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  severityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  severityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
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