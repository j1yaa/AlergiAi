import React from 'react';
import { computeRiskScore } from '../utils/smartAnalyzer';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';

interface RouteParams {
  detectedIngredients: string[];
  allergenWarnings: string[]; // allergens from profile that matched
  safeIngredients: string[];
  productName: string;
  isFood: boolean;
}

export default function ScanResultScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  // 1) Safer product name (no empty / undefined)
  const safeProductName =
    params.productName && params.productName.trim() !== ''
      ? params.productName
      : 'Unknown Item';

  const isFood = params.isFood !== false;
  const isUnknown = !isFood && (safeProductName === 'Unknown' || safeProductName === 'Unknown Item');

  // 2) Use shared AI risk helper (only for food items).
  const {
    riskScore,
    matchedAllergens,
    severity,
    riskTier,
    explanation,
  } = isFood
    ? computeRiskScore(
        params.detectedIngredients ?? [],
        params.allergenWarnings ?? [],
      )
    : { riskScore: 0, matchedAllergens: [], severity: 'LOW' as const, riskTier: 'Low Risk' as const, explanation: '' };

  const hasAllergens = matchedAllergens.length > 0;

  const handleDone = () => {
    navigation.navigate('Dashboard' as never);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Results</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Product Name */}
        <View style={[styles.productCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.productName, { color: colors.text }]}>{safeProductName}</Text>
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
              isUnknown ? colors.secondaryText :
              !isFood ? '#FF9800' :
              hasAllergens ? '#f44336' : '#4CAF50'
            }
          />
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            {isUnknown ? 'Unable to Identify' :
             !isFood ? 'Not a Food Item' :
             hasAllergens ? 'Allergen Detected!' : 'Safe to Consume'}
          </Text>
          <Text style={[styles.statusSubtitle, { color: colors.secondaryText }]}>
            {isUnknown
              ? 'Could not identify this item. Try scanning again with better lighting'
              : !isFood
              ? 'This item is not edible and cannot be analyzed for allergens'
              : hasAllergens
              ? `Contains ${matchedAllergens.length} allergen(s) from your profile`
              : 'No allergens detected from your profile'}
          </Text>

          {/* Risk score from AI helper — only show for food */}
          {isFood && !isUnknown && (
            <>
              <Text style={[styles.riskScoreText, { color: colors.text }]}>
                Risk Score: {riskScore}% - {riskTier}
              </Text>
              <Text style={[styles.severityText, { color: colors.secondaryText }]}>
                Severity Level: {severity}
              </Text>
              {explanation && (
                <Text style={[styles.explanationText, { color: colors.secondaryText }]}>
                  {explanation}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Allergen Warnings */}
        {isFood && hasAllergens && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>⚠️ Allergen Warnings</Text>
            {matchedAllergens.map((allergen, index) => (
              <View key={index} style={styles.allergenItem}>
                <Ionicons name="alert-circle" size={24} color="#f44336" />
                <Text style={styles.allergenText}>{allergen}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Safe Ingredients */}
        {isFood && params.safeIngredients.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✓ Safe Ingredients</Text>
            {params.safeIngredients.map((ingredient, index) => (
              <View key={index} style={styles.safeItem}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#4CAF50"
                />
                <Text style={[styles.safeText, { color: colors.text }]}>{ingredient}</Text>
              </View>
            ))}
          </View>
        )}

        {/* All Detected Ingredients */}
        {isFood && params.detectedIngredients.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 All Detected Ingredients</Text>
            <View style={styles.ingredientsList}>
              {params.detectedIngredients.map((ingredient, index) => (
                <View key={index} style={[styles.ingredientChip, { backgroundColor: colors.inputBackground }]}>
                  <Text style={[styles.ingredientChipText, { color: colors.accent }]}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.card }]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.secondaryText}
          />
          <Text style={[styles.noteText, { color: colors.secondaryText }]}>
            Powered by Gemini AI. Results are based on ingredient detection and
            food.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.scanAgainButton, { borderColor: colors.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="camera" size={20} color={colors.accent} />
          <Text style={[styles.scanAgainText, { color: colors.accent }]}>Scan Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.doneButton, { backgroundColor: colors.accent }]} onPress={handleDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
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
    backgroundColor: colors.inputBackground,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  riskScoreText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
  },
  severityText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  explanationText: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
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
    marginLeft: 10,
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientChipText: {
    fontSize: 13,
  },
  noteCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 10,
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    gap: 8,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
