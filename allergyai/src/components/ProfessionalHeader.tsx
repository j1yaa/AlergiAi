import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadAlertCount } from '../utils/useUnreadAlertCount';

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: string;
}

interface ProfessionalHeaderProps {
  navigation: any;
  currentScreen: string;
}

const menuItems: MenuItem[] = [
  { id: '1', title: 'Dashboard', icon: 'home-outline', screen: 'Dashboard' },
  { id: '2', title: 'Add Meal', icon: 'add-circle-outline', screen: 'AddMeal' },
  { id: '3', title: 'Alerts', icon: 'warning-outline', screen: 'Alerts' },
  { id: '4', title: 'Symptoms', icon: 'medical-outline', screen: 'Symptoms' },
  { id: '5', title: 'Allergens', icon: 'shield-outline', screen: 'Allergens' },
  { id: '6', title: 'Scanner', icon: 'camera-outline', screen: 'Scanner' },
  { id: '7', title: 'Profile', icon: 'person-outline', screen: 'Profile' },
];

export default function ProfessionalHeader({ navigation, currentScreen }: ProfessionalHeaderProps) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const unreadCount = useUnreadAlertCount();

  const getCurrentIcon = () => {
    const current = menuItems.find(item => item.screen === currentScreen);
    return current?.icon || 'home-outline';
  };

  const getCurrentTitle = () => {
    const current = menuItems.find(item => item.screen === currentScreen);
    return current?.title || 'Dashboard';
  };

  const handleMenuSelect = (screen: string) => {
    setDropdownVisible(false);
    navigation.navigate(screen);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={[
        styles.menuItem,
        currentScreen === item.screen && styles.activeMenuItem
      ]}
      onPress={() => handleMenuSelect(item.screen)}
    >
      <View style={[
        styles.iconContainer,
        currentScreen === item.screen && styles.activeIconContainer
      ]}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={currentScreen === item.screen ? '#0B63D6' : '#6C757D'} 
        />
        {item.screen === 'Alerts' && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[
          styles.menuItemText,
          currentScreen === item.screen && styles.activeMenuItemText
        ]}>
          {item.title}
        </Text>
        {currentScreen === item.screen && (
          <View style={styles.currentIndicator}>
            <Text style={styles.currentText}>Current</Text>
          </View>
        )}
      </View>
      {currentScreen === item.screen && (
        <Ionicons name="checkmark-circle" size={16} color="#0B63D6" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoDot} />
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(true)}
          >
            <Ionicons name="home" size={20} color="#0B63D6" />
            <Text style={styles.currentPageText}>{getCurrentTitle()}</Text>
            <Ionicons name="chevron-down" size={16} color="#0B63D6" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal
        visible={dropdownVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setDropdownVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <View>
                <Text style={styles.dropdownTitle}>Quick Navigation</Text>
                <Text style={styles.dropdownSubtitle}>Choose a feature to access</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setDropdownVisible(false)}
              >
                <Ionicons name="close" size={20} color="#6C757D" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={menuItems}
              renderItem={renderMenuItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
  },
  logoInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0B63D6',
  },
  logoDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  currentPageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B63D6',
    marginHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  dropdownContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  dropdownTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  dropdownSubtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 2,
  },
  closeButton: {
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  activeMenuItem: {
    backgroundColor: '#F6F9FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#E3F2FD',
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
  activeMenuItemText: {
    color: '#0B63D6',
  },
  currentIndicator: {
    marginTop: 2,
  },
  currentText: {
    fontSize: 12,
    color: '#0B63D6',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});