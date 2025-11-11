const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Android-specific optimizations
config.resolver.platforms = ['android', 'native', 'web'];
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable Hermes for better performance on Android
config.transformer.hermesCommand = 'hermes';

module.exports = config;