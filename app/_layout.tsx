import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { ActivityIndicator, View } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      setIsSplashScreenVisible(false); // Hide splash screen after loading is complete
    }
  }, [loaded]);

  if (isSplashScreenVisible || !loaded) {
    // You can show a loading indicator or splash screen here while fonts are loading
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Admin Routes */}
        {/* <Stack.Screen
          name="admin/login"
          options={{ headerShown: true, title: "Admin Login" }}
        />
        <Stack.Screen
          name="admin/dashboard"
          options={{ headerShown: true, title: "Admin Dashboard" }}
        /> */}

        {/* 404 page */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />{" "}
      {/* Ensure status bar uses dark theme for light mode */}
    </ThemeProvider>
  );
}
