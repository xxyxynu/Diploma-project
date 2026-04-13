import apiClient from "./config";

export interface Meal {
    recipeName: string;
    ingredients: string[];
    isAiGenerated: boolean;
    isCooked: boolean;
}

export interface DayPlan {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
}

export interface MealPlan {
    _id: string;
    fridgeId: string;
    weekStartDate: string;
    plan: {
        [key: string]: DayPlan;
    };
}

export const mealPlanApi = {
    // 增加参数：fridgeId 和 date (用于计算是哪一周)
    get: async (fridgeId: string, dateStr: string) => {
        const response = await apiClient.get<MealPlan>(`/meal-plan?fridgeId=${fridgeId}&date=${dateStr}`);
        return response.data;
    },

    updateMeal: async (fridgeId: string, dateStr: string, day: string, mealType: 'breakfast' | 'lunch' | 'dinner', recipeName: string, ingredients?: string[]) => {
        const response = await apiClient.put<MealPlan>("/meal-plan/meal", {
            fridgeId, date: dateStr, day, mealType, recipeName, ingredients
        });
        return response.data;
    },

    generateAI: async (fridgeId: string, dateStr: string, language: string) => {
        const response = await apiClient.post<MealPlan>("/meal-plan/generate", {
            fridgeId, date: dateStr, language
        });
        return response.data;
    }
};