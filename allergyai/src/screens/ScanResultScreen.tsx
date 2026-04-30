import React, {useState} from 'react';
import { computeRiskScore } from '../utils/smartAnalyzer';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { createMeal } from '../api/client';

interface RouteParams {
  detectedIngredients: string[];
  allergenWarnings: string[];
  safeIngredients: string[];
  productName: string;
  isFood: boolean;
}

export default function ScanResultScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const {colors} = useTheme();
  const [saving, setSaving] = useState(false);

  const safeProductName =
    params.productName && params.productName.trim() !== ''
      ? params.productName
      : t('scanResult.unknownItem');

  const isFood = params.isFood !== false;
  const isUnknown = !isFood && (safeProductName === 'Unknown' || safeProductName === 'Unknown Item');

  const {
    riskScore,
    matchedAllergens,
    severity,
    riskTier,
    explanation,
    factorData,
  } = isFood
    ? computeRiskScore(
        params.detectedIngredients ?? [],
        allergenMatchList,
      )
    : { riskScore: 0, matchedAllergens: [], severity: 'LOW' as const, riskTier: 'Low Risk' as const, explanation: '', factorData: undefined };

  const hasAllergens = matchedAllergens.length > 0;

  const handleDone = () => {
    navigation.popToTop();
    navigation.navigate('Dashboard' as never);
  };

  const handleSaveMeal = async () => {
    if (!isFood) {
      Alert.alert(t('common.error'), 'Cannot save non-food items as meals');
      return;
    }

    setSaving(true);
      try {
        await createMeal({
          items: params.detectedIngredients,
          note: safeProductName,
          allergens: matchedAllergens,
        });

        Alert.alert(
          t('addMeal.saved'),
          t('addMeal.mealLogged'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Dashboard' as never),
            },
          ]
        );
    } catch (error) {
      console.error('Failed to save meal:', error);
      Alert.alert(
        t('common.error'), 
        'Failed to save meal. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.surface, borderBottomColor: colors.cardBorder}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: colors.text}]}>{t('scanResult.scanResults')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Name */}
        <View style={[styles.productCard, {backgroundColor: colors.surface}]}>
          <Text style={[styles.productName, {color: colors.text}]}>{safeProductName}</Text>
        </View>

        {/* Allergen Status + Risk score */}
        <View
          style={[
            styles.statusCard,
            isUnknown ? styles.unknownCard :
            !isFood ? styles.nonFoodCard :
            hasAllergens ? styles.dangerCard : styles.safeCard,
          ]}
        >
          <Ionicons
            name={
              isUnknown ? 'help-circle' :
              !isFood ? 'ban' :
              hasAllergens ? 'warning' : 'checkmark-circle'
            }
            size={48}
            color={
              isUnknown ? '#9E9E9E' :
              !isFood ? '#FF9800' :
              hasAllergens ? '#f44336' : '#4CAF50'
            }
          />
          <Text style={[styles.statusTitle, {color: colors.text}]}>
            {isUnknown ? t('scanResult.unableToIdentify') :
             !isFood ? t('scanResult.notFoodItem') :
             hasAllergens ? t('scanResult.allergenDetected') : t('scanResult.safeToConsume')}
          </Text>
          <Text style={styles.statusSubtitle}>
            {isUnknown
              ? t('scanResult.unableToIdentifyMessage')
              : !isFood
              ? t('scanResult.notFoodItemMessage')
              : hasAllergens
              ? t('scanResult.containsAllergens', { count: matchedAllergens.length })
              : t('scanResult.noAllergensDetected')}
          </Text>

          {/* Risk score from AI helper — only show for food */}
          {isFood && !isUnknown && (
            <>
              <Text style={[styles.riskScoreText, {color: colors.text}]}>
                {t('scanResult.riskScoreDisplay', {
                  score: riskScore,
                  tier: riskTier === 'Low Risk' ? t('scanResult.riskTierLow')
                      : riskTier === 'Moderate Risk' ? t('scanResult.riskTierModerate')
                      : t('scanResult.riskTierHigh'),
                })}
              </Text>
              <Text style={styles.severityText}>
                {t('scanResult.severityLevel', {
                  level: severity === 'LOW' ? t('scanResult.severityLow')
                       : severity === 'MODERATE' ? t('scanResult.severityModerate')
                       : t('scanResult.severityHigh'),
                })}
              </Text>
              {explanation && (
                <Text style={styles.explanationText}>
                  {factorData
                    ? t('scanResult.riskExplanation', {
                        severity: t(`allergen.${factorData.severityLabel}`),
                        severityWeight: factorData.severityWeight,
                        exposure: t(`scanResult.exposure${factorData.exposureLabel.charAt(0).toUpperCase() + factorData.exposureLabel.slice(1)}`),
                        exposureWeight: factorData.exposureWeight,
                        sensitivity: t(`scanResult.sensitivity${factorData.sensitivityLabel.charAt(0).toUpperCase() + factorData.sensitivityLabel.slice(1)}`),
                        sensitivityWeight: factorData.sensitivityWeight,
                        rawScore: factorData.rawScore,
                      })
                    : t('scanResult.noKnownAllergens')}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Allergen Warnings */}
        {isFood && hasAllergens && (
          <View style={[styles.section, {backgroundColor: colors.surface}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('scanResult.allergenWarnings')}</Text>
            {matchedAllergens.map((allergen, index) => (
              <View key={`allergen-${index}`} style={styles.allergenItem}>
                <Ionicons name="alert-circle" size={24} color="#f44336" />
                <Text style={styles.allergenText}>{allergen}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safe Ingredients */}
        {isFood && params.safeIngredients.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.surface}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('scanResult.safeIngredients')}</Text>
            {params.safeIngredients.map((ingredient, index) => (
              <View key={`safe-${index}`} style={styles.safeItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.safeText, {color: colors.text}]}>{ingredient}</Text>
              </View>
            ))}
          </View>
        )}

        {/* All Detected Ingredients */}
        {isFood && params.detectedIngredients.length > 0 && (
          <View style={[styles.section, {backgroundColor: colors.surface}]}>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>{t('scanResult.allDetectedIngredients')}</Text>
            <View style={styles.ingredientsList}>
              {params.detectedIngredients.map((ingredient, index) => (
                <View key={`ingredient-${index}`} style={styles.ingredientChip}>
                  <Text style={styles.ingredientChipText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Note */}
        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#666"
          />
          <Text style={styles.noteText}>
            {t('scanResult.aiNote')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, {backgroundColor: colors.surface, borderTopColor: colors.cardBorder}]}>
      {isFood && (
        <TouchableOpacity
          style={[styles.saveMealButton, {backgroundColor: colors.success}]}
          onPress={handleSaveMeal}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download" size={18} color="#fff" />
              <Text style={styles.saveMealButtonText}>{t('addMeal.saveMeal')}</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.scanAgainButton, {borderColor: colors.secondary}]}
        onPress={() => navigation.goBack()}
        disabled={saving}
      >
        <Ionicons name="camera" size={20} color={colors.secondary} />
        <Text style={[styles.scanAgainText, {color: colors.secondary}]}>{t('scanResult.scanAgain')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.doneButton, {backgroundColor: colors.secondary}]} 
        onPress={handleDone}
        disabled={saving}
      >
        <Text style={styles.doneButtonText}>{t('scanResult.done')}</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusCard: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  dangerCard: {
    backgroundColor: '#ffebee',
  },
  safeCard: {
    backgroundColor: '#e8f5e9',
  },
  nonFoodCard: {
    backgroundColor: '#fff3e0',
  },
  unknownCard: {
    backgroundColor: '#f5f5f5',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  riskScoreText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
  },
  severityText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  explanationText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginBottom: 8,
  },
  allergenText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginLeft: 12,
  },
  safeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 5,
  },
  safeText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientChipText: {
    fontSize: 13,
    color: '#1976d2',
  },
  noteCard: {
    flexDirection: 'row',
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    lineHeight: 18,
  },
  bottomActions: {
    padding: 16,
    paddingBottom: 35,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  saveMealButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    gap: 8,
  },
  saveMealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2196F3',
    gap: 8,
  },
  scanAgainText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: '#2196F3',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
