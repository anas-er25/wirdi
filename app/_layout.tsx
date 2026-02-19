import { Stack } from "expo-router";
import { useEffect } from "react";
import { I18nManager } from "react-native";
// import { initNotifications } from "../services/notifications";

export default function RootLayout() {
  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // initNotifications();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
