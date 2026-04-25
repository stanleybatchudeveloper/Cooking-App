import type { AiRecipeResponse } from '../types/models';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const buildFallback = (url: string): AiRecipeResponse => {
  const hint = url
    .split('/')
    .pop()
    ?.split('?')[0]
    ?.replace(/-/g, ' ')
    ?.trim();

  return {
    title: hint ? `Recipe from ${hint}` : 'Imported Recipe',
    description: 'Auto-generated fallback summary from the provided recipe link.',
    ingredients: '2 cups main ingredient\n1 tsp salt\n1 tbsp oil',
    instructions:
      '1. Prepare the ingredients.\n2. Cook in stages until tender.\n3. Taste, adjust seasoning, and serve.',
    category: 'Lunch',
    prepTime: '15',
    cookTime: '20',
    servings: '2',
    difficulty: 'Easy',
  };
};

const normalizeJson = (raw: string) => {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
};

export const analyzeRecipeUrl = async (url: string): Promise<AiRecipeResponse> => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return buildFallback(url);
  }

  const prompt = [
    'You are a cooking assistant. Convert the source into a structured recipe JSON.',
    `Source URL: ${url}`,
    'Output only one JSON object with title, description, ingredients, instructions, category, prepTime, cookTime, servings, difficulty.',
  ].join('\n');

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    return buildFallback(url);
  }

  const payload = await response.json();
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? '')
      .join('\n') ?? '';

  const parsed = JSON.parse(normalizeJson(text));
  return {
    title: parsed.title ?? 'Untitled Recipe',
    description: parsed.description ?? '',
    ingredients: parsed.ingredients ?? '',
    instructions: parsed.instructions ?? '',
    category: parsed.category ?? 'Lunch',
    prepTime: String(parsed.prepTime ?? '15'),
    cookTime: String(parsed.cookTime ?? '20'),
    servings: String(parsed.servings ?? '2'),
    difficulty: parsed.difficulty ?? 'Easy',
  };
};
