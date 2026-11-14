import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ToastProvider } from "@/src/components/Toast";
import { useIconFonts } from "@/src/hooks/use-icon-fonts";
import { ensureSeeded } from "@/src/store/db";
import { ThemeProvider } from "@/src/theme/context";

LogBox.ignoreAllLogs(true);

// Keep the native splash visible from cold start until icon fonts register.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useIconFonts();

  useEffect(() => {
    // seed default companies + categories on first launch
    ensureSeeded().catch(() => {});
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="pin" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="stock/add"
                options={{ presentation: "modal", animation: "slide_from_bottom" }}
              />
              <Stack.Screen
                name="stock/reduce"
                options={{ presentation: "modal", animation: "slide_from_bottom" }}
              />
            </Stack>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
