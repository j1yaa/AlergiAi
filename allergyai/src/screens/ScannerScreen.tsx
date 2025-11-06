import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function ScannerScreen() {
    const navigation = useNavigation();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [flashOn, setFlashOn] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleScan = async () => {
        setIsScanning(true);

        // Simulate scanning delay (will be replaced with actual AI analysis later)
        setTimeout(() => {
            setIsScanning(false);
            Alert.alert('Scan Complete', 'Feature coming in Sprint 2!');
        }, 2000);
    };

    const pickImageFromGallery = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need gallery access to scan images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setIsScanning(true);
            setTimeout(() => {
                setIsScanning(false);
                Alert.alert('Image Selected', 'AI analysis coming in Sprint 2!');
            }, 1500);
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
                <Ionicons name="camera-off" size={64} color="#999" />
                <Text style={styles.noPermissionText}>No access to camera</Text>
                <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={() => Camera.requestCameraPermissionsAsync()}
                >
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
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
                    <Text style={styles.headerText}>Scan Food Label</Text>
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
                            <Text style={styles.scanningText}>Analyzing ingredients...</Text>
                        </View>
                    )}
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        Position the ingredients label within the frame
                    </Text>
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    <TouchableOpacity
                        style={styles.galleryButton}
                        onPress={pickImageFromGallery}
                    >
                        <Ionicons name="images" size={30} color="#fff" />
                        <Text style={styles.galleryButtonText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.scanButton}
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
        marginBottom: 30,
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