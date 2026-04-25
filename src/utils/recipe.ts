import type { Recipe, StepData } from '../types/models';

export const categories = [
  'All',
  'Lunch',
  'Tiffins',
  'Snacks',
  'Meals',
  'Desserts',
  'Beverages',
];

export const dietFilters = [
  'All',
  'Vegetarian',
  'Vegan',
  'Keto',
  'High Protein',
  'Gluten Free',
];

export const allergyFilters = [
  'All',
  'Nuts',
  'Dairy',
  'Gluten',
  'Egg',
  'Shellfish',
  'Soy',
];

export const difficultyOptions = ['Easy', 'Medium', 'Hard'];
export const mealPlanDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const emptyRecipe = (): Recipe => ({
  id: '',
  title: '',
  description: '',
  ingredients: '',
  instructions: '',
  imageUrl: '',
  category: 'Lunch',
  prepTime: '',
  cookTime: '',
  servings: '',
  difficulty: 'Easy',
  userId: '',
  timestamp: Date.now(),
  isFavorite: false,
  isPublic: false,
  likesCount: 0,
  commentsCount: 0,
  favoritesCount: 0,
  averageRating: 0,
  ratingsCount: 0,
  dietTags: [],
  allergyTags: [],
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
  userRating: 0,
});

export const formatRelativeDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));

export const parseInstructions = (instructions: string) =>
  instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((raw, index) => {
      const timer = raw.match(/\[TIMER:(\d+)\]/)?.[1];
      const note = raw.match(/\[NOTE:([^\]]+)\]/)?.[1] ?? '';
      return {
        index,
        text: raw
          .replace(/\[TIMER:(\d+)\]/g, '')
          .replace(/\[NOTE:([^\]]+)\]/g, '')
          .trim(),
        timerSeconds: Number(timer ?? 0),
        specialNote: note,
      };
    });

export const stepDataToInstructions = (steps: StepData[]) =>
  steps
    .filter((step) => step.instruction.trim())
    .map((step) => {
      let line = step.instruction.trim();
      if (step.timerSeconds > 0) line += ` [TIMER:${step.timerSeconds}]`;
      if (step.specialNote.trim()) line += ` [NOTE:${step.specialNote.trim()}]`;
      return line;
    })
    .join('\n');

export const instructionsToStepData = (instructions: string): StepData[] => {
  const parsed = parseInstructions(instructions);
  if (!parsed.length) {
    return [{ instruction: '', timerSeconds: 0, specialNote: '' }];
  }

  return parsed.map((step) => ({
    instruction: step.text,
    timerSeconds: step.timerSeconds,
    specialNote: step.specialNote,
  }));
};

export const ingredientLines = (ingredients: string) =>
  ingredients
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

export const formatSeconds = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
