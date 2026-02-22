import { FridgeSwitcherButton } from "@/components/FridgeSwitcher";
import { useFridgeInit } from "@/hooks/useFridgeInit";
import { useFridgeStore } from "@/store/fridgeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, FridgeItem } from "../../api/food";
import { CategoryIcon } from "../../components/CategoryIcon";
import { FilterChip } from "../../components/FilterChip";
import { FoodItemCard } from "../../components/FoodItemCard";

type FilterType = 'all' | 'fresh' | 'expiring' | 'expired';

export default function Fridge() {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore(); // Get selected fridge
    const { loadFridges } = useFridgeInit(); // Initialize fridges

    // State
    const [itemsByCategory, setItemsByCategory] = useState<Record<string, FridgeItem[]>>({});
    const [filteredItems, setFilteredItems] = useState<Record<string, FridgeItem[]>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');

    // Fetch data when fridge changes
    useEffect(() => {
        if (selectedFridge) {
            fetchData();
        }
    }, [selectedFridge]); // 🆕 Refetch when fridge changes

    // Apply filters when data, search, or filter changes
    useEffect(() => {
        applyFilters();
    }, [itemsByCategory, searchQuery, activeFilter]);

    const fetchData = async () => {
        if (!selectedFridge) {
            setLoading(false);
            return;
        }

        try {
            const data = await foodApi.getByCategory(selectedFridge._id);
            setItemsByCategory(data);
        } catch (error: any) {
            console.error('Failed to fetch items:', error);
            Alert.alert('Error', 'Failed to load your fridge. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = () => {
        let filtered: Record<string, FridgeItem[]> = {};

        Object.keys(itemsByCategory).forEach(category => {
            let categoryItems = itemsByCategory[category];

            // Apply status filter
            if (activeFilter !== 'all') {
                categoryItems = categoryItems.filter(item => item.status === activeFilter);
            }

            // Apply search filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                categoryItems = categoryItems.filter(item =>
                    item.name.toLowerCase().includes(query) ||
                    item.brand?.toLowerCase().includes(query)
                );
            }

            // Only include category if it has items
            if (categoryItems.length > 0) {
                filtered[category] = categoryItems;
            }
        });

        setFilteredItems(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadFridges(); // Reload fridges too
        fetchData();
    };

    const handleDeleteItem = async (itemId: string, itemName: string) => {
        Alert.alert(
            "Delete Item",
            `Remove ${itemName} from your fridge?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await foodApi.delete(itemId);
                            Alert.alert("Success", "Item removed from fridge");
                            fetchData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete item");
                        }
                    }
                }
            ]
        );
    };

    // Calculate total count
    const totalItems = Object.values(filteredItems).reduce((sum, items) => sum + items.length, 0);
    const categories = Object.keys(filteredItems);

    //how loading or no fridge message
    if (loading) {
        return (
            <View className="flex-1 bg-[#F8F9FA] items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-gray-500 mt-4 font-pmedium">Loading your fridge...</Text>
            </View>
        );
    }

    if (!selectedFridge) {
        return (
            <View className="flex-1 bg-[#F8F9FA] items-center justify-center p-6">
                <MaterialCommunityIcons name="fridge-off-outline" size={80} color="#9CA3AF" />
                <Text className="text-xl font-pbold text-gray-800 mt-4 mb-2">No Fridge Selected</Text>
                <Text className="text-gray-500 text-center mb-6">
                    Create a new fridge or join an existing one to get started
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/fridge-management/create")}
                    className="bg-primary px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-pbold">Create Fridge</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-primary pt-16 pb-6 px-6 rounded-b-[30px]">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-white text-2xl font-pbold">My Fridge</Text>
                        <Text className="text-white/80 text-sm font-pmedium mt-1">
                            {totalItems} {totalItems === 1 ? 'item' : 'items'} total
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/add-manual")}
                        className="bg-white/20 p-3 rounded-full"
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Fridge Switcher Button */}
                <View className="mb-3">
                    <FridgeSwitcherButton />
                </View>

                {/* Search Bar */}
                <View className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 flex-row items-center">
                    <Ionicons name="search" size={20} color="white" />
                    <TextInput
                        className="flex-1 ml-3 text-white font-pregular"
                        placeholder="Search items..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Chips */}
            <View className="flex-grow-0 flex-shrink-0">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="px-6 py-4"
                    contentContainerStyle={{ gap: 8 }}
                >
                    <FilterChip
                        label="All"
                        count={Object.values(itemsByCategory).reduce((sum, items) => sum + items.length, 0)}
                        active={activeFilter === 'all'}
                        onPress={() => setActiveFilter('all')}
                    />
                    <FilterChip
                        label="Fresh"
                        count={Object.values(itemsByCategory).reduce((sum, items) =>
                            sum + items.filter(i => i.status === 'fresh').length, 0
                        )}
                        active={activeFilter === 'fresh'}
                        onPress={() => setActiveFilter('fresh')}
                        color="green"
                    />
                    <FilterChip
                        label="Expiring"
                        count={Object.values(itemsByCategory).reduce((sum, items) =>
                            sum + items.filter(i => i.status === 'expiring').length, 0
                        )}
                        active={activeFilter === 'expiring'}
                        onPress={() => setActiveFilter('expiring')}
                        color="orange"
                    />
                    <FilterChip
                        label="Expired"
                        count={Object.values(itemsByCategory).reduce((sum, items) =>
                            sum + items.filter(i => i.status === 'expired').length, 0
                        )}
                        active={activeFilter === 'expired'}
                        onPress={() => setActiveFilter('expired')}
                        color="red"
                    />
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
                }
            >
                {/* Empty State */}
                {totalItems === 0 && (
                    <View className="items-center px-6 mt-12">
                        <View className="w-32 h-32 bg-gray-100 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="fridge-outline" size={64} color="#9CA3AF" />
                        </View>
                        <Text className="text-xl font-pbold text-gray-800 mb-2">
                            {searchQuery || activeFilter !== 'all' ? 'No Items Found' : 'Your Fridge is Empty'}
                        </Text>
                        <Text className="text-gray-500 text-center mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : activeFilter !== 'all'
                                    ? `No ${activeFilter} items in your fridge`
                                    : 'Start by scanning a barcode or adding items manually'
                            }
                        </Text>
                        {!searchQuery && activeFilter === 'all' && (
                            <TouchableOpacity
                                onPress={() => router.push("/(tabs)/scan")}
                                className="bg-primary px-6 py-3 rounded-xl"
                            >
                                <Text className="text-white font-pbold">Scan Your First Item</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Category Sections */}
                {categories.map((category) => (
                    <View key={category} className="px-6 mb-6 ">
                        {/* Category Header */}
                        <View className="flex-row items-center justify-between mb-3 ">
                            <View className="flex-row items-center">
                                <CategoryIcon category={category} />
                                <Text className="text-lg font-pbold text-gray-800 ml-2">{category}</Text>
                                <View className="bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                                    <Text className="text-gray-600 text-xs font-bold">
                                        {filteredItems[category].length}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Items in Category */}
                        <View className="space-y-3 ">
                            {filteredItems[category].map((item) => (
                                <FoodItemCard
                                    key={item._id}
                                    item={item}
                                    onDelete={() => handleDeleteItem(item._id, item.name)}
                                    onPress={() => router.push({ pathname: "/food/[id]", params: { id: item._id } })}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}







