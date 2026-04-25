/**
 * Translation utilities using Google Cloud Translation API
 * 
 * Usage:
 * 1. Set up Google Cloud Translation API in your Firebase project
 * 2. Create a Cloud Function that calls the Translation API (due to CORS restrictions)
 * 3. Use translateText() to call the function
 * 
 * Alternative: Use browser-based solution with Google Translate widget
 */

interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface LanguageInfo {
  code: string;
  name: string;
}

// Common supported languages
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
];

/**
 * Translate text using Google Cloud Translation API via Firebase Cloud Function
 * 
 * Note: This requires a Cloud Function to be set up in Firebase to avoid CORS issues.
 * Create a function like:
 * 
 * exports.translate = functions.https.onCall(async (data, context) => {
 *   const translate = require('@google-cloud/translate').v2;
 *   const translator = new translate.Translator({ projectId: process.env.GCP_PROJECT });
 *   
 *   const [translation] = await translator.translate(data.text, data.targetLanguage);
 *   return { translatedText: translation };
 * });
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  cloudFunctionUrl?: string
): Promise<TranslationResult | null> {
  try {
    if (!cloudFunctionUrl) {
      console.warn(
        'Cloud Function URL not provided. Translation requires Firebase Cloud Function setup.'
      );
      return null;
    }

    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      translatedText: result.translatedText,
      sourceLanguage,
      targetLanguage,
    };
  } catch (error) {
    console.error('Translation error:', error);
    return null;
  }
}

/**
 * Use browser-based Google Translate API (alternative approach)
 * This loads Google Translate dynamically
 */
export function loadGoogleTranslate(): void {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.async = true;
  script.src =
    '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';

  // Define callback
  (window as any).googleTranslateElementInit = function () {
    new (window as any).google.translate.TranslateElement(
      {
        pageLanguage: 'en',
      },
      'google_translate_element'
    );
  };

  document.head.appendChild(script);
}

/**
 * Get human-readable language name from language code
 */
export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code.toUpperCase();
}

/**
 * Detect language code from common abbreviations
 */
export function normalizeLanguageCode(code: string): string {
  const normalized: { [key: string]: string } = {
    und: 'en', // Unknown → English
    eng: 'en',
    spa: 'es',
    fra: 'fr',
    deu: 'de',
    ita: 'it',
    por: 'pt',
    rus: 'ru',
    jpn: 'ja',
    zho: 'zh',
    kor: 'ko',
    hin: 'hi',
    ara: 'ar',
  };

  return normalized[code] || code;
}
