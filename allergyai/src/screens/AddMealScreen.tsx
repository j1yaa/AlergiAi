import React, { useState, useEffect } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, FlatList, Modal, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeMeal, createMeal, getMeals, deleteMeal } from '../api/client';
import { AnalyzeResponse, Meal } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { createAlert } from '../utils/allergenAlertService';
import { computeRiskScore } from '../utils/smartAnalyzer';
import { getAlertSeverityFromScore } from '../utils/riskConstants';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

export default function AddMealScreen() {
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const [mealName, setMealName] = useState<string>('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'allergens' | 'safe'>('all');

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
      console.log('Loaded meals data:', JSON.stringify(mealsData.slice(0, 2), null, 2));
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

  const handleDeleteMeal = async (mealId: string) => {
    Alert.alert(
      t('addMeal.deleteMeal'),
      t('addMeal.deleteMealConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMeal(mealId);
              await loadMeals();
            } catch (error) {
              console.error('Failed to delete meal:', error);
              Alert.alert(t('common.error'), t('addMeal.couldNotDeleteMeal'));
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('addMeal.noDate');
    try {
      return new Date(dateString).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return t('addMeal.invalidDate');
    }
  };

  const sortedFilteredMeals = meals
    .filter(meal => {
      if (filterBy === 'allergens') return meal.allergens && meal.allergens.length > 0;
      if (filterBy === 'safe') return !meal.allergens || meal.allergens.length === 0;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || a.timeStamp || 0).getTime();
      const dateB = new Date(b.createdAt || b.timeStamp || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const renderMeal = ({ item }: { item: Meal }) => {
    if (!item.notes && !item.note && !item.description && (!item.items || item.items.length === 0)) {
      return null;
    }
    
    console.log('Rendering meal item:', JSON.stringify(item, null, 2));
    return (
    <View style={[styles.mealCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealDate, { color: colors.icon }]}>
          {item.createdAt ? formatDate(item.createdAt) : 
           item.timeStamp ? formatDate(item.timeStamp.toString()) : 
           item.dateISO ? formatDate(item.dateISO) :
           t('addMeal.noDate')}
        </Text>
      </View>
      
      {(item.note || item.notes || item.description) && (
        <Text style={[styles.mealName, { color: colors.text }]}>{item.note || item.notes || item.description}</Text>
      )}
      
      {item.items && item.items.length > 0 && (
        <View style={styles.mealIngredientsContainer}>
          <Text style={[styles.mealIngredientsLabel, { color: colors.icon }]}>{t('addMeal.ingredients')}</Text>
          <View style={styles.mealIngredientsList}>
            {item.items.map((ingredient, index) => (
              <View key={index} style={[styles.mealIngredientPill, { backgroundColor: `${colors.secondary}15` }]}>
                <Text style={[styles.mealIngredientText, { color: colors.secondary }]}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.deleteButton, { backgroundColor: `${colors.error}15` }]}
        onPress={() => handleDeleteMeal(item.id)}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
  };

  const handleSave = async () => {
    const nameFromName = (mealName ?? '').trim();
    const nameFromDesc = (description ?? '').trim();
    const finalName = nameFromName || nameFromDesc;
    
    const ing = Array.isArray(result?.ingredients)
      ? result!.ingredients
      : (description ?? '').split(',').map(i => i.trim()).filter(Boolean);

    if (!finalName && ing.length === 0) {
      Alert.alert(t('addMeal.missingInfo'), t('addMeal.missingInfoMessage'));
      return;
    }

    console.log('Saving meal:', { finalName, ing, hasResult: !!result, allergens: result?.allergens });

    setSaving(true);
    try {
      // Run analysis if not already done
      let analysisResult = result;
      if (!analysisResult && description.trim()) {
        try {
          analysisResult = await analyzeMeal({ description });
          setResult(analysisResult);
        } catch (e) {
          console.warn('Auto-analysis failed:', e);
        }
      }

      await createMeal({
        items: ing,
        note: finalName || t('addMeal.unnamedMeal')
      });

      let allergensToAlert: string[] = [];
      let riskScore = 0;
      let riskTier = t('addMeal.lowRisk');

      if (analysisResult?.allergens && analysisResult.allergens.length > 0) {
        allergensToAlert = analysisResult.allergens;
        riskScore = analysisResult.riskScore;
        riskTier = analysisResult.riskScore <= 30 ? t('addMeal.lowRisk') : analysisResult.riskScore <= 70 ? t('addMeal.moderateRisk') : t('addMeal.highRisk');
      }

      if (allergensToAlert.length > 0) {
        console.log('Creating alerts for allergens:', allergensToAlert);

        const alertSeverity = getAlertSeverityFromScore(riskScore);

        const allergenList = allergensToAlert.join(', ');
        const riskLevel = riskScore > 70 ? 'HIGH' : riskScore > 30 ? 'MODERATE' : 'LOW';
        Alert.alert(
          t('addMeal.allergenDetected'),
          `${riskTier.toUpperCase()}: ${allergenList}\n\n${t('addMeal.riskScoreLabel')} ${riskScore}%`,
          [{ text: t('common.ok'), style: 'default' }]
        );
        
        for (const allergen of allergensToAlert) {
          const severity = riskScore > 70 ? 'high' : riskScore > 30 ? 'medium' : 'low';
          console.log(`Creating alert: ${allergen} - ${alertSeverity}`);
          await createAlert(allergen, alertSeverity, 'meal');
        }
      } else {
        console.log('No allergens detected');
        Alert.alert(t('addMeal.saved'), t('addMeal.mealLogged'));
      }
      setMealName('');
      setDescription('');
      setResult(null);
      if (showHistory) {
        loadMeals();
      }
    } catch (e) {
      console.error('Save failed:', e);
      Alert.alert(t('common.error'), t('addMeal.couldNotSaveMeal'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('addMeal.logYourMeal')}</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: `${colors.secondary}15`, borderColor: colors.secondary }]}
            onPress={handleViewHistory}
          >
            <Ionicons name="time-outline" size={18} color={colors.secondary} />
            <Text style={[styles.historyButtonText, { color: colors.secondary }]}>{t('addMeal.mealHistory')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>{t('addMeal.mealNameLabel')}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.cardBorder, color: colors.text }]}
        value={mealName}
        onChangeText={(text) => {
          console.log('TextInput onChange:', `"${text}"`);
          setMealName(text);
        }}
        placeholder={t('addMeal.mealName')}
        placeholderTextColor={colors.icon}
        testID="mealNameInput"
      />

      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.cardBorder, color: colors.text }]}
        placeholder={t('addMeal.enterIngredients')}
        placeholderTextColor={colors.icon}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.secondary }]}
        onPress={handleAnalyze}
        disabled={loading || !description.trim()}
      >
        <Text style={styles.buttonText}>
          {loading ? t('addMeal.analyzingPleaseWait') : t('addMeal.analyze')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.success }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? t('common.loading') : t('addMeal.saveMeal')}
        </Text>
      </TouchableOpacity>

      {result && (
        <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
          <Text style={[styles.resultTitle, { color: colors.text }]}>{t('addMeal.analysisResult')}</Text>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('addMeal.ingredients')}</Text>
            <View style={styles.pillContainer}>
              {result.ingredients.map((ingredient, index) => (
                <View key={index} style={[styles.pill, { backgroundColor: `${colors.secondary}15` }]}>
                  <Text style={[styles.pillText, { color: colors.secondary }]}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('addMeal.allergens')}</Text>
            <View style={styles.pillContainer}>
              {result.allergens.length > 0 ? (
                result.allergens.map((allergen, index) => (
                  <View key={index} style={[styles.pill, { backgroundColor: `${colors.error}15` }]}>
                    <Text style={[styles.allergenText, { color: colors.error }]}>{allergen}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noAllergens, { color: colors.success }]}>{t('addMeal.noAllergens')}</Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('addMeal.riskAssessment')}</Text>
            <View style={styles.riskContainer}>
              <Text style={[styles.riskScoreText, { color: colors.text }]}>{t('addMeal.riskScoreLabel')} {result.riskScore}%</Text>
              <View style={[
                styles.riskBar,
                { backgroundColor: `${result.riskScore <= 30 ? colors.success : result.riskScore <= 70 ? colors.warning : colors.error}20` }
              ]}>
                <View style={[
                  styles.riskFill,
                  {
                    width: `${result.riskScore}%`,
                    backgroundColor: result.riskScore <= 30 ? colors.success : result.riskScore <= 70 ? colors.warning : colors.error
                  }
                ]} />
              </View>
              <Text style={[
                styles.riskTierText,
                { color: result.riskScore <= 30 ? colors.success : result.riskScore <= 70 ? colors.warning : colors.error }
              ]}>
                {result.riskScore <= 30 ? t('addMeal.lowRisk') : result.riskScore <= 70 ? t('addMeal.moderateRisk') : t('addMeal.highRisk')}
              </Text>
            </View>
          </View>

          <Text style={[styles.advice, { color: colors.icon }]}>{result.advice}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.scanCard, { backgroundColor: `${colors.secondary}10`, borderColor: colors.secondary }]}
        onPress={() => navigation.navigate('Scanner' as never)}
      >
        <View style={[styles.scanIconContainer, { backgroundColor: `${colors.secondary}20` }]}>
          <Ionicons name="scan" size={32} color={colors.secondary} />
        </View>
        <View style={styles.scanTextContainer}>
          <Text style={[styles.scanTitle, { color: colors.text }]}>{t('addMeal.scanFoodLabel')}</Text>
          <Text style={[styles.scanSubtitle, { color: colors.icon }]}>{t('addMeal.quickAllergenDetectionWithCamera')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.icon} />
      </TouchableOpacity>

      <Modal
        visible={showHistory}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('addMeal.mealHistory')}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Sort & Filter Bar */}
          <View style={[styles.filterBar, { borderBottomColor: colors.cardBorder }]}>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.icon }]}>Sort:</Text>
              {(['newest', 'oldest'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, { borderColor: colors.cardBorder }, sortOrder === opt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setSortOrder(opt)}
                >
                  <Text style={[styles.filterChipText, { color: sortOrder === opt ? '#fff' : colors.text }]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: colors.icon }]}>Filter:</Text>
              {(['all', 'allergens', 'safe'] as const).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.filterChip, { borderColor: colors.cardBorder }, filterBy === opt && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setFilterBy(opt)}
                >
                  <Text style={[styles.filterChipText, { color: filterBy === opt ? '#fff' : colors.text }]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {loadingMeals ? (
            <View style={styles.loadingContainer}>
              <Text style={{ color: colors.text }}>{t('addMeal.loadingMeals')}</Text>
            </View>
          ) : meals.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>{t('addMeal.noMealsLogged')}</Text>
              <Text style={[styles.emptySubtext, { color: colors.icon }]}>{t('addMeal.startTrackingMeals')}</Text>
            </View>
          ) : (
            <FlatList
              data={sortedFilteredMeals}
              renderItem={renderMeal}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.mealsList}
            />
          )}
        </View>
      </Modal>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    flexShrink: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  allergenText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noAllergens: {
    fontStyle: 'italic',
    fontSize: 14,
    fontWeight: '500',
  },
  riskContainer: {
    alignItems: 'center',
  },
  riskScoreText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  riskBar: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  riskFill: {
    height: '100%',
  },
  riskTierText: {
    fontSize: 15,
    fontWeight: '700',
  },
  advice: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
  },
  scanIconContainer: {
    marginRight: 14,
    padding: 10,
    borderRadius: 12,
  },
  scanTextContainer: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  scanSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
  },
  reminderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  mealsList: {
    padding: 20,
  },
  mealCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    position: 'relative',
    borderWidth: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 8,
    borderRadius: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealIngredientsContainer: {
    marginTop: 8,
  },
  mealIngredientsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  mealIngredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  mealIngredientPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mealIngredientText: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
