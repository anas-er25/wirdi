import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "وردي",
  slug: "wirdi",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",

  scheme: "wirdi", // ne pas mettre arabe ici

  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.anaserrakibi.wirdi",
  },

  android: {
    package: "com.anaserrakibi.wirdi", // obligatoire pour build
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png",
      backgroundColor: "#EDE1CF",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },

  web: {
    output: "static",
    favicon: "./assets/images/icon.png",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },

  extra: {
    eas: {
      projectId: "9c25e5e9-87c2-4883-b9ae-8d01acc63ed3",
    },
  },
};

export default config;