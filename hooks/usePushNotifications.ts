import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from '../api/config';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export const usePushNotifications = () => {
    const [expoPushToken, setExpoPushToken] = useState<string | undefined>('');

    // 👇 把这个函数改成 const 并导出
    const registerForPushNotificationsAsync = async () => {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return null;
        }

        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId,
            });
            token = tokenData.data;
            setExpoPushToken(token);

            // 这里不再自动发送给后端，改为返回 Token 让外部处理，或者保留自动发送
            // 为了 Profile 开关逻辑，我们主要需要它返回 token
            return token;
        } catch (e) {
            console.error("Error fetching token", e);
            return null;
        }
    };

    // 初始化时依然自动注册一次（为了首次安装体验）
    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                // 自动同步逻辑保留
                apiClient.put('/auth/push-token', { pushToken: token }).catch(() => { });
            }
        });
    }, []);

    // 🆕 导出 register 方法
    return { expoPushToken, registerForPushNotificationsAsync };
};