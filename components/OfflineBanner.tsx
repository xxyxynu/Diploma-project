import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { useNetworkStore } from '../store/networkStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const OfflineBanner = () => {
    const { isConnected } = useNetworkStore();
    const insets = useSafeAreaInsets();

    // 用于控制 Banner 升降的动画值
    const translateY = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: isConnected ? -100 : insets.top, // 如果有网就藏起来，没网就降到刘海屏/状态栏下方
            useNativeDriver: true,
            friction: 8,
            tension: 40,
        }).start();
    }, [isConnected, insets.top]);

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }] }
            ]}
            className="absolute top-0 left-0 right-0 bg-red-500 flex-row justify-center items-center py-2 px-4 shadow-md z-50"
        >
            <Ionicons name="cloud-offline" size={16} color="white" />
            <Text className="text-white font-pbold text-xs ml-2">
                No Internet Connection
            </Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        elevation: 10, // Android shadow
        zIndex: 9999,  // Make sure it's on top of everything
    }
});