import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import healthService, { HealthData } from '../services/healthSevice';

export default function WearableSettingsScreen() {
    const { colors } = useTheme();
    const { t } = useLanguage();
    const [healthSyncEnabled, setHealthSyncEnabled] = useState(false);
    const [lastSync, setLastSync] = useState<Date | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [healthData, setHealthData] = useState<HealthData[]>([]);

    useEffect(() => {
        loadStoredData();
    }, []);

    const loadStoredData = async () => {
        try {
            const stored = await healthService.getStoredHealthData();
            setHealthData(stored);
            if (stored.length > 0) {
                setHealthSyncEnabled(true);
                setLastSync(new Date(stored[0].timestamp));
            }
        } catch (error) {
            console.error('Failed to load the stored health data:', error);
        }
    };

    const handleEnableHealthSync = async () => {
        try {
            setSyncing(true);
            const granted = await healthService.requestPermissions();
            if (granted) {
                setHealthSyncEnabled(true);
                await syncHealthData();
                Alert.alert(t('common.success'), t('wearable.syncEnabled'));
            } else {
                Alert.alert(t('wearable.permissionRequired'), t('wearable.permissionMessage'));
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('wearable.syncFailed'));
        } finally {
            setSyncing(false);
        }
    };

    const syncHealthData = async () => {
        try {
            setSyncing(true);
            const data = await healthService.syncHealthData();
            await healthService.saveHealthData(data);
            setHealthData(data);
            setLastSync(new Date());
            Alert.alert(t('common.success'), t('wearable.syncComplete'));
        } catch (error) {
            Alert.alert(t('common.error'), t('wearable.syncFailed'));
        } finally {
            setSyncing(false);
        }
    };

    const handleDisableSync = () => {
        Alert.alert(
            t('wearable.disableSync'),
            t('wearable.disableSyncConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('wearable.disable'),
                    style: 'destructive',
                    onPress: () => {
                        setHealthSyncEnabled(false);
                        setHealthData([]);
                        setLastSync(null);
                    }
                }
            ]
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="watch" size={24} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{t('wearable.title')}</Text>
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingTitle, { color: colors.text }]}>{t('wearable.healthSync')}</Text>
                        <Text style={[styles.settingDesc, { color: colors.icon }]}>
                            {t('wearable.syncDescription')}
                        </Text>
                    </View>
                    <Switch
                        value={healthSyncEnabled}
                        onValueChange={healthSyncEnabled ? handleDisableSync : handleEnableHealthSync}
                        trackColor={{ false: colors.cardBorder, true: colors.primary + '40' }}
                        thumbColor={healthSyncEnabled ? colors.primary : colors.icon}
                        disabled={syncing}
                    />
                </View>

                {healthSyncEnabled && (
                    <>
                        <TouchableOpacity
                            style={[styles.syncButton, { backgroundColor: colors.primary, opacity: syncing ? 0.6 : 1 }]}
                            onPress={syncHealthData}
                            disabled={syncing}
                        >
                            <Ionicons name={syncing ? "hourglass" : "sync"} size={20} color="#fff" />
                            <Text style={styles.syncButtonText}>
                                {syncing ? t('wearable.syncing') : t('wearable.syncNow')}
                            </Text>
                        </TouchableOpacity>

                        {lastSync && (
                            <Text style={[styles.lastSync, { color: colors.icon }]}>
                                {t('wearable.lastSync', {time: lastSync.toLocaleString() })}
                            </Text>
                        )}
                    </>
                )}
            </View>

            {healthData.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.surface }]}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="analytics" size={24} color={colors.success}/>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>
                            {t('wearable.recentData')}</Text>
                    </View>

                    {healthData.slice(0, 3).map((data, index) => (
                        <View key={index} style={[styles.dataRow, {
                            borderBottomColor: colors.cardBorder
                        }]}>
                            <Text style={[styles.dataDate, { color: colors.icon }]}>
                                {new Date(data.timestamp).toLocaleDateString()}
                            </Text>
                            <View style={styles.dataMetrics}>
                                {data.heartRate && (
                                    <View style={styles.metric}>
                                        <Ionicons name="heart" size={16} color={colors.error}/>
                                        <Text style={[styles.metricText, { color: colors.text }]}>
                                            {data.heartRate} bpm</Text>
                                    </View>
                                )}
                                {data.steps && (
                                    <View style={styles.metric}>
                                        <Ionicons name="walk" size={16} color={colors.primary}/>
                                        <Text style={[styles.metricText, { color: colors.text }]}>
                                            {data.steps.toLocaleString()}</Text>
                                    </View>
                                )}
                                {data.sleepHours && (
                                    <View style={styles.metric}>
                                        <Ionicons name="moon" size={16} color={colors.warning}/>
                                        <Text style={[styles.metricText, { color: colors.text }]}>
                                            {data.sleepHours}h</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.icon}/>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                        {t('wearable.supportedDevices')}</Text>
                </View>
                <View style={styles.deviceList}>
                    <View style={styles.deviceItem}>
                        <Ionicons name="watch" size={20} color={colors.icon}/>
                        <Text style={[styles.deviceName, { color: colors.text }]}>Apple Watch</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success }/>
                    </View>
                    <View style={styles.deviceItem}>
                        <Ionicons name="pulse" size={20} color={colors.icon}/>
                        <Text style={[styles.deviceName, { color: colors.text }]}>Fitbit</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                    <View style={styles.deviceItem}>
                        <Ionicons name="watch" size={20} color={colors.icon}/>
                        <Text style={[styles.deviceName, { color: colors.text }]}>Samsung Galaxy Watch</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                    <View style={styles.deviceItem}>
                        <Ionicons name="fitness" size={20} color={colors.icon}/>
                        <Text style={[styles.deviceName, { color: colors.text }]}>Garmin</Text>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    </View>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface }]}>
                <Text style={[styles.cardTitle, { color: colors.text, marginLeft: 0 }]}>
                    {t('wearable.howItWorks')}</Text>
                <Text style={[styles.infoText, { color: colors.icon }]}>
                    {t('wearable.howItWorksDesc')}
                </Text>
                <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success}/>
                        <Text style={[styles.benefitText, { color: colors.text }]}>
                            {t('wearable.benefit1')}</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success}/>
                        <Text style={[styles.benefitText, { color: colors.text }]}>
                            {t('wearable.benefit2')}</Text>
                    </View>
                    <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success}/>
                        <Text style={[styles.benefitText, { color: colors.text }]}>
                            {t('wearable.benefit3')}</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    card: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    settingInfo: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    settingDesc: {
        fontSize: 14,
    },
    syncButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    lastSync: {
        fontSize: 12,
        textAlign: 'center',
    },
    dataRow: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    dataDate: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    dataMetrics: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricText: {
        fontSize: 14,
        marginLeft: 4,
    },
    deviceList: {
        marginTop: 12,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    deviceName: {
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    deviceStatus: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    benefitsList: {
        gap: 8,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    benefitText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
});