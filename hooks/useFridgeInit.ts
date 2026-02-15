import { useEffect } from 'react';
import { fridgeApi } from '../api/fridge';
import { useFridgeStore } from '../store/fridgeStore';
import { useUserStore } from '../store/userStore';

/**
 * Hook to initialize and load user's fridges
 * Call this in your main app layout or tabs layout
 */
export const useFridgeInit = () => {
    const { isLoggedIn } = useUserStore();
    const { setFridges, setLoading } = useFridgeStore();

    useEffect(() => {
        if (isLoggedIn) {
            loadFridges();
        }
    }, [isLoggedIn]);

    const loadFridges = async () => {
        try {
            setLoading(true);
            const fridges = await fridgeApi.getAllFridges();
            setFridges(fridges);
        } catch (error) {
            console.error('Failed to load fridges:', error);
            // Don't show alert here, just log
        } finally {
            setLoading(false);
        }
    };

    return { loadFridges };
};