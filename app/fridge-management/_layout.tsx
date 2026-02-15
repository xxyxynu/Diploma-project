import { Stack } from "expo-router";

export default function FridgeManagementLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="create" />
            <Stack.Screen name="join" />
            <Stack.Screen name="manage" />
        </Stack>
    );
}