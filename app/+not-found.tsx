// app/+not-found.tsx
import React from "react";
import { View, Text } from "react-native";

const NotFoundPage = () => (
  <View className="flex-1 justify-center items-center text-white">
    <Text className="text-xl">404 - Page Not Found</Text>
  </View>
);

export default NotFoundPage;
