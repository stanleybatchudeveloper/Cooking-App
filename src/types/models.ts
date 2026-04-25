export type Recipe = {
  id: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  imageUrl: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: string;
  userId: string;
  timestamp: number;
  isFavorite: boolean;
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  favoritesCount: number;
  averageRating: number;
  ratingsCount: number;
  dietTags: string[];
  allergyTags: string[];
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  userRating: number;
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
};

export type AppNotification = {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  recipeId: string;
  recipeTitle: string;
  type: string;
  timestamp: number;
  isRead: boolean;
};

export type AiRecipeResponse = {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: string;
};

export type RecipeVersion = {
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  category: string;
  difficulty: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  timestamp: number;
};

export type StepData = {
  instruction: string;
  timerSeconds: number;
  specialNote: string;
};

export type SaveRecipeInput = {
  recipeId?: string;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  category: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: string;
  isPublic: boolean;
  imageUri?: string | null;
  dietTags: string[];
  allergyTags: string[];
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};
