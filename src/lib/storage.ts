import AsyncStorage from '@react-native-async-storage/async-storage';

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = async <T>(key: string, value: T) => {
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

const remove = async (key: string) => {
  await AsyncStorage.removeItem(key);
};

export const localStore = {
  readJson,
  writeJson,
  remove,
};

export const storageKeys = {
  myRecipes: 'rn_kitchen_my_recipes',
  exploreRecipes: 'rn_kitchen_explore_recipes',
  addRecipeDraft: 'rn_kitchen_add_recipe_draft',
  pantryItems: 'rn_kitchen_pantry_items',
  shoppingItems: 'rn_kitchen_shopping_items',
  mealPlan: 'rn_kitchen_meal_plan',
  recipeVersions: 'rn_kitchen_recipe_versions',
};
