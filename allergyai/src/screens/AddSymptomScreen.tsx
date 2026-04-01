import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, Platform } from 'react-native';
import { saveSymptom } from '../api/client';

import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Symptom } from '../types';

export default function AddSymptomScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(1);
  const [category, setCategory] = useState<Symptom['category']>('other');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [triggers, setTriggers] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [onGoing, setOngoing] = useState(true);
  const [saving, setSaving] = useState(false);

  const categories: { key: Symptom['category']; label: string; icon: string}[] = [
    { key: 'digestive', label: t('symptoms.digestive'), icon: 'restaurant' },
    { key: 'skin', label: t('symptoms.skin'), icon: 'hand-left' },
    { key: 'respiratory', label: t('symptoms.respiratory'), icon: 'fitness' },
    { key: 'cardiovascular', label: t('symptoms.cardiovascular'), icon: 'heart' },
    { key: 'neurological', label: t('symptoms.neurological'), icon: 'analytics' },
    { key: 'other', label: t('symptoms.other'), icon: 'ellipsis-horizontal' },
  ];

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert(t('common.error'), t('symptoms.descriptionRequired'));
      return;
    }
    
    setSaving(true);
    try {
      const symptomData: Omit<Symptom, 'id'> = {
        dateISO: new Date().toISOString(),
        description: description.trim(),
        severity,
        category,
        resolved: !onGoing,
        resolvedAt: !onGoing ? new Date().toISOString() : undefined,
      };
      
      if (duration && parseInt(duration) > 0) {
          symptomData.duration = parseInt(duration);
      }
      if (location.trim()) {
        symptomData.location = location.trim();
      }
      if (triggers.trim()) {
        symptomData.triggers = triggers.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (medications.trim()) {
        symptomData.medications = medications.split(',').map(m => m.trim()).filter(Boolean);
      }
      if (notes.trim()) {
        symptomData.notes = notes.trim();
      }

      await saveSymptom(symptomData);
      Alert.alert(t('common.success'), t('symptoms.symptomLogged'));
      setDescription('');
      setSeverity(1);
      setCategory('other');
      setDuration('');
      setLocation('');
      setTriggers('');
      setMedications('');
      setNotes('');
      setOngoing(true);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save symptom:', error);
      Alert.alert(t('symptoms.error'), t('symptoms.couldNotLogSymptom'));
    } finally {
      setSaving(false);
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
          onPress: () => {
            setDescription('');
            setSeverity(1);
            setCategory('other');
            setDuration('');
            setLocation('');
            setTriggers('');
            setMedications('');
            setNotes('');
            setOngoing(true);
          },
        },
      ]
    );
  };

  const getSeverityColor = (sev: number) => {
    const colorsSeverity = ['#4CAF50', '#8BC34A', '#FFC107', '#FF9800', '#F44336'];
    return colorsSeverity[sev - 1] || '#9E9E9E';
  };

  const getSeverityLabel = (sev: number) => {
    const labels = ['Minimal', 'Mild', 'Moderate', 'Severe', 'Critical'];
    return labels[sev - 1] || '';
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background}]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Symptom Details</Text>

        <Text style={[styles.label, { color: colors.icon }]}>Description *</Text>
        <TextInput
          style={[styles.textInput, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('symptoms.describeYourSymptom')}
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.label, { color: colors.icon }]}>{t('symptoms.category')}</Text>
        <View style={styles.categoryGrid}> 
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryButton, 
                  {backgroundColor: colors.surface, borderColor: colors.cardBorder},
                  category === cat.key && {backgroundColor: colors.primary, borderColor: colors.primary},
              ]}
              onPress={() => setCategory(cat.key)}
            >
              <Ionicons 
                name={cat.icon as any} 
                size={20} 
                color={category === cat.key ? '#fff' : colors.icon} 
              />
              <Text style={[
                styles.categoryText, 
                {color: category === cat.key ? '#fff' : colors.text},
                ]}
              >
                {cat.label}
              </Text>              
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.icon }]}>{t('symptoms.severity')} ({severity}/5)</Text>
          <View style={styles.severityContainer}> 
            <View style={styles.severityButtons}>
              {[1, 2, 3, 4, 5].map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.severityButton, 
                    {backgroundColor: severity >= sev ? getSeverityColor(sev) : colors.surface, borderColor: getSeverityColor(sev),
                  },
                ]}
                onPress={() => setSeverity(sev)}
              >
                <Text style={[
                  styles.severityButtonText,  
                    {color: severity >= sev ? '#fff' : colors.text},
                  ]}
                >
                  {sev}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.severityLabel, {color: getSeverityColor(severity)}]}>
            {getSeverityLabel(severity)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information</Text>

        <Text style={[styles.label, { color: colors.icon }]}>Duration (minutes)</Text>
        <TextInput
          style={[styles.input, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={duration}
          onChangeText={setDuration}
          placeholder="ex. 30"
          placeholderTextColor={colors.icon}
          keyboardType="numeric"
        />  

        <Text style={[styles.label, { color: colors.icon }]}>Location</Text>
        <TextInput
          style={[styles.input, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={location}
          onChangeText={setLocation}
          placeholder= "Where did this occur? (ex. Restaurant, Home)"
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={2}
        /> 

        <Text style={[styles.label, { color: colors.icon }]}>Suspected Triggers</Text>
        <TextInput
          style={[styles.textInput, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={triggers}
          onChangeText={setTriggers}
          placeholder="Separate with commas (ex. peanuts, shellfish)"
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={2}
        /> 

        <Text style={[styles.label, { color: colors.icon }]}>Medications Taken</Text>
        <TextInput
          style={[styles.textInput, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={medications}
          onChangeText={setMedications}
          placeholder="Separate with commas (ex. Benadryl, EpiPen)"
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={2}
        /> 

        <Text style={[styles.label, { color: colors.icon }]}>Additional Notes</Text>
        <TextInput
          style={[styles.textInput, {borderColor: colors.cardBorder, color: colors.text, backgroundColor: colors.surface}]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any other relevant information..."
          placeholderTextColor={colors.icon}
          multiline
          numberOfLines={3}
        /> 

        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: colors.text }]}>Symptom is ongoing</Text>
          <Switch
            value={onGoing}
            onValueChange={setOngoing}
            trackColor={{false: colors.cardBorder, true: colors.primary + '40'}}
            thumbColor={onGoing ? colors.primary : colors.icon}
          /> 
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.clearButton, {backgroundColor: colors.surface, borderColor: colors.cardBorder}]} 
          onPress={handleClear}
        >
          <Text style={[styles.clearButtonText, {color: colors.text }]}>{t('symptoms.clear')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, {backgroundColor: colors.primary}]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : t('symptoms.save')}
          </Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  },
  textInput: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  severityContainer: {
    alignItems: 'center',
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  severityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  severityLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 40,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    },
});