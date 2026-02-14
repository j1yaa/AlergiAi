import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { saveSymptom } from '../api/client';
import { useTheme } from '../hooks/useTheme';

export default function AddSymptomScreen() {
  const { colors } = useTheme();
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
      
      console.log('Saving symptom:', symptom);
      const savedSymptom = await saveSymptom(symptom);
      console.log('Saved symptom:', savedSymptom);
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

  const handleClear = () => {
    Alert.alert(
      'Clear Form',
      'Are you sure you want to clear all entered data?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setDescription('');
            setSeverity(3);
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Log Symptom</Text>
      
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.icon }]}
        placeholder="Describe your symptom..."
        placeholderTextColor={colors.icon}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.severityContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Severity (1-5)</Text>
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
          <Text>Mild</Text>
          <Text style={styles.severityValue}>{severity}</Text>
          <Text>Severe</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading || description.trim().length === 0}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Saving...' : 'Save Symptom'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClear}
          disabled={loading}
        >
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: '#F44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 0.4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});