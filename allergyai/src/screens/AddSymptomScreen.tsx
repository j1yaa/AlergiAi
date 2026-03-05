import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { saveSymptom } from '../api/client';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function AddSymptomScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('symptoms.descriptionRequired'));
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
      Alert.alert(t('common.success'), t('symptoms.symptomLogged'));
    } catch (error) {
      console.error('Failed to save symptom:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert(t('common.error'), t('symptoms.couldNotLogSymptom'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert(
      t('symptoms.clearForm'),
      t('symptoms.clearFormConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('symptoms.clear'), 
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('symptoms.logSymptom')}</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder={t('symptoms.describeYourSymptom')}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />
      
      <View style={styles.severityContainer}>
        <Text style={styles.label}>{t('symptoms.severityLabel')}</Text>
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
          <Text>{t('symptoms.mild')}</Text>
          <Text style={styles.severityValue}>{severity}</Text>
          <Text>{t('symptoms.severe')}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSave}
          disabled={loading || description.trim().length === 0}
        >
          <Text style={styles.buttonText}>
            {loading ? t('common.loading') : t('symptoms.save')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={handleClear}
          disabled={loading}
        >
          <Text style={styles.clearButtonText}>{t('symptoms.clear')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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