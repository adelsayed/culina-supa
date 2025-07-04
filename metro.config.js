const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure these extensions are supported
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('sql');

// Enable symlinks and node_modules hoisting
config.resolver.unstable_enableSymlinks = true;

// Clear cache and reset Metro
config.resetCache = true;

module.exports = config;
