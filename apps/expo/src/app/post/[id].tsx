import { SafeAreaView, Text, View } from "react-native";
import { Stack, useGlobalSearchParams } from "expo-router";

export default function Post() {
  const { id } = useGlobalSearchParams<{ id: string }>();

  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Post" }} />
      <View className="h-full w-full p-4">
        <Text className="text-primary py-2 text-3xl font-bold">Post {id}</Text>
        <Text className="text-foreground py-4">Content not available</Text>
      </View>
    </SafeAreaView>
  );
}
