const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const path = require("path");

const config = getSentryExpoConfig(__dirname);

// Permite que Metro Bundler (Expo) vea archivos fuera de apps/mobile/.
// Necesario para que @kuvox/theme (packages/theme/) sea resolvible.
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "../../packages"),
];

module.exports = config;
