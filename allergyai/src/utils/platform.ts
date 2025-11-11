import { Platform, Dimensions } from 'react-native';

export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isWeb = Platform.OS === 'web';

export const getScreenDimensions = () => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
};

export const getAndroidVersion = () => {
  if (isAndroid) {
    return Platform.Version;
  }
  return null;
};

export const platformStyles = {
  android: {
    elevation: 4,
    borderRadius: 8,
  },
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  web: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
  },
};

export const getPlatformStyle = () => {
  if (isAndroid) return platformStyles.android;
  if (isIOS) return platformStyles.ios;
  return platformStyles.web;
};