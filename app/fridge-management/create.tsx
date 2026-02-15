import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { fridgeApi } from "../../api/fridge";
import { useFridgeStore } from "../../store/fridgeStore";

const EMOJI_OPTIONS = ['🧊', '🍎', '🥕', '🥛', '🍕', '🥗', '🍔', '🌮'];

export default function CreateFridge() {
    const router = useRouter();
    const { addFridge } = useFridgeStore();

    const [name, setName] = useState("");
    const [selectedEmoji, setSelectedEmoji] = useState("🧊");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert("Missing Name", "Please enter a fridge name.");
            return;
        }

        setLoading(true);
        try {
            const fridge = await fridgeApi.createFridge({
                name: name.trim(),
                emoji: selectedEmoji
            });

            addFridge(fridge);

            Alert.alert("Success", "Fridge created successfully!", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to create fridge");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-primary pt-14 pb-6 px-6 rounded-b-[30px]">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-pbold">Create Fridge</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-8">
                {/* Fridge Name */}
                <View className="mb-6">
                    <Text className="text-gray-700 font-pmedium mb-2">Fridge Name</Text>
                    <TextInput
                        className="bg-gray-100 px-4 py-3 rounded-xl text-gray-800 font-pregular"
                        placeholder="e.g. Family Fridge"
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                {/* Emoji Selection */}
                <View className="mb-8">
                    <Text className="text-gray-700 font-pmedium mb-3">Choose Icon</Text>
                    <View className="flex-row flex-wrap gap-3">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <TouchableOpacity
                                key={emoji}
                                onPress={() => setSelectedEmoji(emoji)}
                                className={`w-16 h-16 rounded-2xl items-center justify-center ${selectedEmoji === emoji
                                        ? 'bg-primary border-2 border-primary'
                                        : 'bg-gray-100'
                                    }`}
                            >
                                <Text className="text-3xl">{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    onPress={handleCreate}
                    disabled={loading}
                    className={`py-4 rounded-2xl ${loading ? 'bg-gray-300' : 'bg-secondary'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-pbold text-lg">
                            Create Fridge
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}