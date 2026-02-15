import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Fridge } from '../api/fridge';

interface FridgeState {
    // All fridges user is a member of
    fridges: Fridge[];

    // Currently selected fridge
    selectedFridge: Fridge | null;

    // Loading states
    loading: boolean;

    // Actions
    setFridges: (fridges: Fridge[]) => void;
    setSelectedFridge: (fridge: Fridge | null) => void;
    addFridge: (fridge: Fridge) => void;
    updateFridge: (fridgeId: string, updates: Partial<Fridge>) => void;
    removeFridge: (fridgeId: string) => void;
    setLoading: (loading: boolean) => void;
    clearFridges: () => void;
}

export const useFridgeStore = create<FridgeState>()(
    persist(
        (set, get) => ({
            fridges: [],
            selectedFridge: null,
            loading: false,

            setFridges: (fridges) => {
                set({ fridges });

                // If no fridge selected and user has fridges, select first one
                if (!get().selectedFridge && fridges.length > 0) {
                    set({ selectedFridge: fridges[0] });
                }

                // If selected fridge is no longer in list, clear selection
                if (get().selectedFridge) {
                    const stillExists = fridges.find(
                        f => f._id === get().selectedFridge!._id
                    );
                    if (!stillExists) {
                        set({ selectedFridge: fridges.length > 0 ? fridges[0] : null });
                    }
                }
            },

            setSelectedFridge: (fridge) => set({ selectedFridge: fridge }),

            addFridge: (fridge) => {
                const fridges = [...get().fridges, fridge];
                set({ fridges });

                // Auto-select if first fridge
                if (fridges.length === 1) {
                    set({ selectedFridge: fridge });
                }
            },

            updateFridge: (fridgeId, updates) => {
                const fridges = get().fridges.map(f =>
                    f._id === fridgeId ? { ...f, ...updates } : f
                );
                set({ fridges });

                // Update selected fridge if it's the one being updated
                if (get().selectedFridge?._id === fridgeId) {
                    set({ selectedFridge: { ...get().selectedFridge!, ...updates } });
                }
            },

            removeFridge: (fridgeId) => {
                const fridges = get().fridges.filter(f => f._id !== fridgeId);
                set({ fridges });

                // If removed fridge was selected, select another
                if (get().selectedFridge?._id === fridgeId) {
                    set({ selectedFridge: fridges.length > 0 ? fridges[0] : null });
                }
            },

            setLoading: (loading) => set({ loading }),

            clearFridges: () => set({
                fridges: [],
                selectedFridge: null,
                loading: false
            })
        }),
        {
            name: 'fridge-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);