import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { analyzeImg } from '../utils/geminiService';
import { getAllergens } from '../api/client';
import { matchIngredientsWallergens } from '../utils/allergenMatcher';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';


type RootStackParamList = {
    ScanResult: {
        productName: string;
        detectedIngredients: string[];
        allergenWarnings: string[];
        allergensSeverity: { name: string; severity: 'minimal' | 'low' | 'moderate' | 'high' | 'severe' }[];
        safeIngredients: string[];
        isFood: boolean;
    };
};

export default function ScannerScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const cameraRef = useRef<CameraView>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [flashOn, setFlashOn] = useState(false);
    const { t, language } = useLanguage();

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const convertImgToBase64 = async (imageUri: string): Promise<string> => {
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
    };

    const processImage = async (imageUri: string) => {
        try {
            setIsScanning(true);

            // Convert image to base64
            const base64Img = await convertImgToBase64(imageUri);

            // Analyze the image
            const geminiResult = await analyzeImg(base64Img, language);

            // If quota was exceeded, warn the user before continuing
            if ((geminiResult as any)._fallback) {
                Alert.alert(
                    'AI Quota Reached',
                    'The AI scanner is temporarily unavailable (daily quota exceeded). Results may be incomplete. Add billing at aistudio.google.com to restore full functionality.',
                    [{ text: 'Continue Anyway' }]
                );
            }

            // Get users allergens
            const allergenResponse = await getAllergens();
            const userAllergens = allergenResponse.allergens || [];
            const allergensSeverity = allergenResponse.allergensSeverity || [];

            // Compare ingredients with user allergens (using category-aware matching + AI categories)
            const { matches: allergenWarnings, safe: safeIngredients } =
                matchIngredientsWallergens(
                    geminiResult.detectedIngredients,
                    userAllergens,
                    geminiResult.allergenCategories
                );

            // Go to the result screen
            navigation.navigate('ScanResult', {
                productName: geminiResult.productName || 'Unknown Product',
                detectedIngredients: geminiResult.detectedIngredients,
                allergenWarnings,
                allergensSeverity,
                safeIngredients,
                isFood: geminiResult.isFood,
            });
            
            setIsScanning(false);
        } catch (error) {
            setIsScanning(false);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            Alert.alert(t('scanner.analysisFailed'), errorMessage, [{ text: 'OK' }]);
        }
    };

    const handleScan = async () => {
        if (!cameraRef.current) {
            Alert.alert(t('common.error'), t('scanner.cameraError'));
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({ base64: false });
            await processImage(photo.uri);
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert(t('common.error'), t('scanner.photoError'));
        }
    };

    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(t('scanner.permissionDenied'), t('scanner.cameraPermissionDenied'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled && result.assets.length > 0) {
            await processImage(result.assets[0].uri);
        }
    };

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Ionicons name="eye-off" size={64} color="#999" />
                <Text style={styles.noPermissionText}>{t('scanner.noAccessToCamera')}</Text>
                <Text style={styles.permissionSubtext}>{t('scanner.galleryPermissionMessage')}</Text>
                <TouchableOpacity
                    style={styles.galleryFallbackButton}
                    onPress={pickImageFromGallery}
                >
                    <Ionicons name="images" size={24} color="#2196F3" />
                    <Text style={styles.galleryFallbackText}>{t('scanner.grantPermission')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                enableTorch={flashOn}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>{t('scanner.scanFoodLabel')}</Text>
                    <TouchableOpacity
                        style={styles.flashButton}
                        onPress={() => setFlashOn(!flashOn)}
                    >
                        <Ionicons
                            name={flashOn ? "flash" : "flash-off"}
                            size={26}
                            color="#fff"
                        />
                    </TouchableOpacity>
                </View>

                {/* Scanning Frame */}
                <View style={styles.scannerFrame}>
                    <View style={[styles.frameCorner, styles.topLeft]} />
                    <View style={[styles.frameCorner, styles.topRight]} />
                    <View style={[styles.frameCorner, styles.bottomLeft]} />
                    <View style={[styles.frameCorner, styles.bottomRight]} />

                    {isScanning && (
                        <View style={styles.scanningOverlay}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.scanningText}>{t('scanner.analyzingIngredients')}</Text>
                        </View>
                    )}
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        {t('scanner.positionLabelWithinFrame')}
                    </Text>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity
                        style={styles.galleryButton}
                        onPress={pickImageFromGallery}
                        disabled={isScanning}
                    >
                        <Ionicons name="images" size={30} color="#fff" />
                        <Text style={styles.galleryButtonText}>{t('scanner.gallery')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
                        onPress={handleScan}
                        disabled={isScanning}
                    >
                        <View style={styles.scanButtonInner}>
                            <Ionicons name="scan" size={40} color="#2196F3" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.placeholderButton} />
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        flex: 1,
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    closeButton: {
        width: 40,
    },
    headerText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    flashButton: {
        width: 40,
        alignItems: 'flex-end',
    },
    scannerFrame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 30,
    },
    frameCorner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#2196F3',
    },
    topLeft: {
        top: -150,
        left: -100,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: -150,
        right: -100,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: -150,
        left: -100,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: -150,
        right: -100,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    scanningOverlay: {
        alignItems: 'center',
    },
    scanningText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
        fontWeight: '500',
    },
    instructionsContainer: {
        paddingHorizontal: 40,
        paddingVertical: 20,
        alignItems: 'center',
    },
    instructionsText: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.9,
    },
    bottomControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 50,
    },
    galleryButton: {
        alignItems: 'center',
    },
    galleryButtonText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
    },
    scanButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    scanButtonDisabled: {
        opacity: 0.6,
    },
    scanButtonInner: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#2196F3',
    },
    placeholderButton: {
        width: 60,
    },
    noPermissionText: {
        color: '#999',
        fontSize: 16,
        marginTop: 20,
        marginBottom: 10,
    },
    permissionSubtext: {
        color: '#666',
        fontSize: 14,
        marginBottom: 30,
        textAlign: 'center',
    },
    galleryFallbackButton: {
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2196F3',
    },
    galleryFallbackText: {
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    permissionButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 10,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});