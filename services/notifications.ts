// import * as Notifications from "expo-notifications";
// import { Platform } from "react-native";

// Notifications.setNotificationHandler({
//   handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
//     shouldShowAlert: true,
//     shouldPlaySound: true,
//     shouldSetBadge: false,
//     shouldShowBanner: true,
//     shouldShowList: true,
//   }),
// });

// export async function initNotifications() {
//   if (Platform.OS === "web") return false;

//   const { status } = await Notifications.requestPermissionsAsync();
//   if (status !== "granted") return false;

//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.HIGH,
//       sound: "default",
//     });
//   }

//   return true;
// }

// export async function scheduleDailyNotification(
//   identifier: string,
//   title: string,
//   body: string,
//   hour: number,
//   minute: number
// ) {
//   if (Platform.OS === "web") return;

//   try {
//     await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});

//     const trigger: Notifications.DailyTriggerInput = {
//       type: Notifications.SchedulableTriggerInputTypes.DAILY,
//       hour,
//       minute,
//     };

//     await Notifications.scheduleNotificationAsync({
//       identifier,
//       content: { title, body, sound: "default" },
//       trigger,
//     });
//   } catch (e) {
//     // Expo Go on Android can fail; dev build fixes it.
//     console.warn("scheduleDailyNotification failed:", e);
//   }
// }
