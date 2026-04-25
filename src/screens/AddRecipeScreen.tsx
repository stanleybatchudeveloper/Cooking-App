import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagChip } from '../components/TagChip';
import { useApp } from '../context/AppContext';
import { localStore, storageKeys } from '../lib/storage';
import { useVoiceRecording } from '../lib/voiceRecording';
import { palette } from '../theme/tokens';
import type { StepData } from '../types/models';
import {
  allergyFilters,
  categories,
  difficultyOptions,
  instructionsToStepData,
  stepDataToInstructions,
} from '../utils/recipe';

const dietOptions = ['Vegetarian', 'Vegan', 'Keto', 'High Protein', 'Gluten Free'];

type AddRecipeScreenProps = {
  recipeId?: string;
  embedded?: boolean;
};

export function AddRecipeScreen({
  recipeId,
  embedded = false,
}: AddRecipeScreenProps) {
  const navigation = useNavigation<any>();
  const {
    myRecipes,
    aiImportData,
    clearAiImport,
    saveRecipe,
    isBusy,
  } = useApp();

  const recipeToEdit = useMemo(
    () => myRecipes.find((item) => item.id === recipeId),
    [myRecipes, recipeId],
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [steps, setSteps] = useState<StepData[]>([
    { instruction: '', timerSeconds: 0, specialNote: '' },
  ]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState('Lunch');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [isPublic, setIsPublic] = useState(false);
  const [dietTags, setDietTags] = useState<string[]>([]);
  const [allergyTags, setAllergyTags] = useState<string[]>([]);
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [fatGrams, setFatGrams] = useState('');

  useEffect(() => {
    const loadDraft = async () => {
      if (recipeToEdit) {
        setTitle(recipeToEdit.title);
        setDescription(recipeToEdit.description);
        setIngredients(recipeToEdit.ingredients);
        setSteps(instructionsToStepData(recipeToEdit.instructions));
        setImageUri(recipeToEdit.imageUrl || null);
        setCategory(recipeToEdit.category);
        setPrepTime(recipeToEdit.prepTime);
        setCookTime(recipeToEdit.cookTime);
        setServings(recipeToEdit.servings);
        setDifficulty(recipeToEdit.difficulty);
        setIsPublic(recipeToEdit.isPublic);
        setDietTags(recipeToEdit.dietTags);
        setAllergyTags(recipeToEdit.allergyTags);
        setCalories(recipeToEdit.calories ? String(recipeToEdit.calories) : '');
        setProteinGrams(
          recipeToEdit.proteinGrams ? String(recipeToEdit.proteinGrams) : '',
        );
        setCarbsGrams(recipeToEdit.carbsGrams ? String(recipeToEdit.carbsGrams) : '');
        setFatGrams(recipeToEdit.fatGrams ? String(recipeToEdit.fatGrams) : '');
        return;
      }

      const draft = await localStore.readJson<{
        title: string;
        description: string;
        ingredients: string;
        steps: StepData[];
        category: string;
        prepTime: string;
        cookTime: string;
        servings: string;
        difficulty: string;
        isPublic: boolean;
        dietTags: string[];
        allergyTags: string[];
        calories: string;
        proteinGrams: string;
        carbsGrams: string;
        fatGrams: string;
        imageUri: string | null;
      } | null>(storageKeys.addRecipeDraft, null);

      if (draft) {
        setTitle(draft.title);
        setDescription(draft.description);
        setIngredients(draft.ingredients);
        setSteps(
          draft.steps?.length
            ? draft.steps
            : [{ instruction: '', timerSeconds: 0, specialNote: '' }],
        );
        setCategory(draft.category ?? 'Lunch');
        setPrepTime(draft.prepTime ?? '');
        setCookTime(draft.cookTime ?? '');
        setServings(draft.servings ?? '');
        setDifficulty(draft.difficulty ?? 'Easy');
        setIsPublic(Boolean(draft.isPublic));
        setDietTags(draft.dietTags ?? []);
        setAllergyTags(draft.allergyTags ?? []);
        setCalories(draft.calories ?? '');
        setProteinGrams(draft.proteinGrams ?? '');
        setCarbsGrams(draft.carbsGrams ?? '');
        setFatGrams(draft.fatGrams ?? '');
        setImageUri(draft.imageUri ?? null);
      }
    };

    loadDraft().catch(() => undefined);
  }, [recipeToEdit]);

  useEffect(() => {
    if (!recipeToEdit && aiImportData) {
      setTitle(aiImportData.title);
      setDescription(aiImportData.description);
      setIngredients(aiImportData.ingredients);
      setSteps(instructionsToStepData(aiImportData.instructions));
      setCategory(aiImportData.category);
      setPrepTime(aiImportData.prepTime);
      setCookTime(aiImportData.cookTime);
      setServings(aiImportData.servings);
      setDifficulty(aiImportData.difficulty);
      clearAiImport();
    }
  }, [aiImportData, clearAiImport, recipeToEdit]);

  useEffect(() => {
    if (recipeToEdit) return;

    localStore
      .writeJson(storageKeys.addRecipeDraft, {
        title,
        description,
        ingredients,
        steps,
        category,
        prepTime,
        cookTime,
        servings,
        difficulty,
        isPublic,
        dietTags,
        allergyTags,
        calories,
        proteinGrams,
        carbsGrams,
        fatGrams,
        imageUri,
      })
      .catch(() => undefined);
  }, [
    allergyTags,
    calories,
    carbsGrams,
    category,
    cookTime,
    description,
    dietTags,
    difficulty,
    fatGrams,
    imageUri,
    ingredients,
    isPublic,
    prepTime,
    proteinGrams,
    recipeToEdit,
    servings,
    steps,
    title,
  ]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length) {
      setImageUri(result.assets[0].uri);
    }
  };

  const toggleListItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const onSave = async () => {
    await saveRecipe({
      recipeId,
      title,
      description,
      ingredients,
      instructions: stepDataToInstructions(steps),
      category,
      prepTime,
      cookTime,
      servings,
      difficulty,
      isPublic,
      imageUri: imageUri && imageUri !== recipeToEdit?.imageUrl ? imageUri : null,
      dietTags,
      allergyTags,
      calories: Number(calories || 0),
      proteinGrams: Number(proteinGrams || 0),
      carbsGrams: Number(carbsGrams || 0),
      fatGrams: Number(fatGrams || 0),
    });

    if (embedded && !recipeId) {
      setTitle('');
      setDescription('');
      setIngredients('');
      setSteps([{ instruction: '', timerSeconds: 0, specialNote: '' }]);
      setImageUri(null);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{recipeId ? 'Edit Recipe' : 'Create Recipe'}</Text>
            <Text style={styles.subtitle}>
              Ported from the Android app with browser-safe editing controls.
            </Text>
          </View>
          {!embedded ? (
            <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
          ) : null}
        </View>

        <Pressable style={styles.coverCard} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.coverImage} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={34} color={palette.sage} />
              <Text style={styles.coverText}>Add Cover Photo</Text>
            </View>
          )}
        </Pressable>

        <EditorCard title="Basics">
          <LabeledInput label="Recipe Name" value={title} onChangeText={setTitle} />
          <LabeledInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <LabeledInput
            label="Ingredients"
            value={ingredients}
            onChangeText={setIngredients}
            multiline
            helper="One ingredient per line"
          />
        </EditorCard>

        <EditorCard title="Details">
          <Text style={styles.groupLabel}>Category</Text>
          <View style={styles.chipWrap}>
            {categories.filter((item) => item !== 'All').map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={category === item}
                onPress={() => setCategory(item)}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>Difficulty</Text>
          <View style={styles.chipWrap}>
            {difficultyOptions.map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={difficulty === item}
                onPress={() => setDifficulty(item)}
              />
            ))}
          </View>

          <View style={styles.row}>
            <NumericInput label="Prep" value={prepTime} onChangeText={setPrepTime} />
            <NumericInput label="Cook" value={cookTime} onChangeText={setCookTime} />
            <NumericInput label="Serves" value={servings} onChangeText={setServings} />
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.switchTitle}>Publish to Explore</Text>
              <Text style={styles.switchSubtitle}>
                Private recipes stay in your own collection.
              </Text>
            </View>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>
        </EditorCard>

        <EditorCard title="Nutrition & Tags">
          <Text style={styles.groupLabel}>Diet Tags</Text>
          <View style={styles.chipWrap}>
            {dietOptions.map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={dietTags.includes(item)}
                onPress={() => toggleListItem(item, dietTags, setDietTags)}
              />
            ))}
          </View>

          <Text style={styles.groupLabel}>Allergy Tags</Text>
          <View style={styles.chipWrap}>
            {allergyFilters.filter((item) => item !== 'All').map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={allergyTags.includes(item)}
                onPress={() => toggleListItem(item, allergyTags, setAllergyTags)}
              />
            ))}
          </View>

          <View style={styles.row}>
            <NumericInput label="Calories" value={calories} onChangeText={setCalories} />
            <NumericInput
              label="Protein"
              value={proteinGrams}
              onChangeText={setProteinGrams}
            />
          </View>
          <View style={styles.row}>
            <NumericInput label="Carbs" value={carbsGrams} onChangeText={setCarbsGrams} />
            <NumericInput label="Fat" value={fatGrams} onChangeText={setFatGrams} />
          </View>
        </EditorCard>

        <EditorCard title="Cooking Steps">
          {steps.map((step, index) => {
            const { isRecording, startRecording, stopRecording } = useVoiceRecording((text) => {
              setSteps((current) =>
                current.map((item, itemIndex) =>
                  itemIndex === index
                    ? { ...item, instruction: item.instruction + (item.instruction ? ' ' : '') + text }
                    : item,
                ),
              );
            });

            return (
              <View key={`${index}-${step.instruction}`} style={styles.stepCard}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Step {index + 1}</Text>
                  {steps.length > 1 ? (
                    <Pressable
                      onPress={() =>
                        setSteps((current) => current.filter((_, item) => item !== index))
                      }
                    >
                      <Ionicons name="trash-outline" size={18} color={palette.danger} />
                    </Pressable>
                  ) : null}
                </View>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Instructions</Text>
                  <Pressable
                    style={[
                      styles.voiceButton,
                      isRecording ? styles.voiceButtonRecording : undefined,
                    ]}
                    onPress={isRecording ? stopRecording : startRecording}
                  >
                    <Ionicons
                      name={isRecording ? 'stop-circle' : 'mic-outline'}
                      size={16}
                      color={isRecording ? palette.danger : palette.sage}
                    />
                    <Text
                      style={[
                        styles.voiceButtonText,
                        isRecording ? styles.voiceStopText : undefined,
                      ]}
                    >
                      {isRecording ? 'Stop' : 'Talk'}
                    </Text>
                  </Pressable>
                </View>
                <TextInput
                  value={step.instruction}
                  onChangeText={(value) =>
                    setSteps((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, instruction: value } : item,
                      ),
                    )
                  }
                  multiline
                  placeholder="Describe the step..."
                  placeholderTextColor="#98A19B"
                  style={[styles.input, styles.multilineInput]}
                />
                <View style={styles.row}>
                  <NumericInput
                    label="Timer (sec)"
                    value={step.timerSeconds ? String(step.timerSeconds) : ''}
                    onChangeText={(value) =>
                      setSteps((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, timerSeconds: Number(value || 0) }
                            : item,
                        ),
                      )
                    }
                  />
                </View>
                <LabeledInput
                  label="Special Note"
                  value={step.specialNote}
                  onChangeText={(value) =>
                    setSteps((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, specialNote: value } : item,
                      ),
                    )
                  }
                  multiline
                />
              </View>
            );
          })}

          <Pressable
            style={styles.addStepButton}
            onPress={() =>
              setSteps((current) => [
                ...current,
                { instruction: '', timerSeconds: 0, specialNote: '' },
              ])
            }
          >
            <Text style={styles.addStepLabel}>Add Step</Text>
          </Pressable>
        </EditorCard>

        <Pressable style={styles.saveButton} onPress={onSave} disabled={isBusy}>
          <Text style={styles.saveButtonText}>{isBusy ? 'Saving...' : 'Save Recipe'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LabeledInput({
  label,
  value,
  onChangeText,
  multiline = false,
  helper,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  helper?: string;
}) {
  const { isRecording, startRecording, stopRecording, liveTranscript, detectedLanguage, confidence } = useVoiceRecording((text) => {
    onChangeText(value + (value ? ' ' : '') + text);
  });

  const getLangEmoji = (lang: string) => {
    const langEmojis: { [key: string]: string } = {
      'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
      'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'zh': '🇨🇳', 'ko': '🇰🇷',
    };
    return langEmojis[lang] || '🌐';
  };

  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.voiceControlsWrapper}>
          {isRecording && (
            <View style={styles.liveIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                {getLangEmoji(detectedLanguage)} {confidence}%
              </Text>
            </View>
          )}
          <Pressable
            style={[
              styles.voiceButton,
              isRecording ? styles.voiceButtonRecording : undefined,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={18}
              color={isRecording ? palette.danger : palette.sage}
            />
            <Text style={[styles.voiceButtonText, isRecording ? styles.voiceStopText : undefined]}>
              {isRecording ? 'Stop' : 'Talk'}
            </Text>
          </Pressable>
        </View>
      </View>
      {isRecording && liveTranscript ? (
        <View style={styles.liveTranscriptBox}>
          <Text style={styles.liveTranscriptLabel}>Live Transcript</Text>
          <Text style={styles.liveTranscriptText}>{liveTranscript}</Text>
        </View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        placeholderTextColor="#98A19B"
        style={[styles.input, multiline ? styles.multilineInput : undefined]}
      />
      {helper ? <Text style={styles.helperText}>{helper}</Text> : null}
    </View>
  );
}

function NumericInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  const { isRecording, startRecording, stopRecording, liveTranscript, detectedLanguage, confidence } = useVoiceRecording((text) => {
    const numbers = text.replace(/\D/g, '');
    if (numbers) onChangeText(numbers);
  });

  const getLangEmoji = (lang: string) => {
    const langEmojis: { [key: string]: string } = {
      'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 'it': '🇮🇹',
      'pt': '🇵🇹', 'ru': '🇷🇺', 'ja': '🇯🇵', 'zh': '🇨🇳', 'ko': '🇰🇷',
    };
    return langEmojis[lang] || '🌐';
  };

  return (
    <View style={[styles.inputGroup, styles.flexInput]}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.voiceControlsWrapper}>
          {isRecording && (
            <View style={styles.liveIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>
                {getLangEmoji(detectedLanguage)} {confidence}%
              </Text>
            </View>
          )}
          <Pressable
            style={[
              styles.voiceButton,
              isRecording ? styles.voiceButtonRecording : undefined,
            ]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? 'stop-circle' : 'mic-outline'}
              size={16}
              color={isRecording ? palette.danger : palette.sage}
            />
          </Pressable>
        </View>
      </View>
      {isRecording && liveTranscript ? (
        <View style={styles.liveTranscriptBox}>
          <Text style={styles.liveTranscriptLabel}>Live Transcript</Text>
          <Text style={styles.liveTranscriptText}>{liveTranscript}</Text>
        </View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: palette.muted,
    lineHeight: 20,
    maxWidth: 320,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
  },
  coverCard: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 16,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  coverText: {
    color: palette.sage,
    fontWeight: '800',
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 16,
  },
  cardTitle: {
    color: palette.ink,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: 14,
  },
  groupLabel: {
    color: palette.ink,
    fontWeight: '800',
    marginBottom: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  switchRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchTitle: {
    color: palette.ink,
    fontWeight: '800',
  },
  switchSubtitle: {
    color: palette.muted,
    marginTop: 4,
    maxWidth: 240,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    color: palette.muted,
    fontWeight: '700',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F0F8F1',
  },
  voiceButtonRecording: {
    backgroundColor: '#FFE8EB',
  },
  voiceButtonText: {
    color: palette.sage,
    fontWeight: '700',
    fontSize: 12,
  },
  voiceStopText: {
    color: palette.danger,
  },
  voiceControlsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFE8EB',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.danger,
  },
  recordingText: {
    fontSize: 11,
    color: palette.danger,
    fontWeight: '600',
  },
  liveTranscriptBox: {
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: palette.orange,
  },
  liveTranscriptLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: palette.muted,
    marginBottom: 4,
  },
  liveTranscriptText: {
    fontSize: 14,
    color: palette.ink,
    lineHeight: 20,
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    color: palette.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    marginTop: 6,
    color: palette.muted,
    fontSize: 12,
  },
  stepCard: {
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: palette.paper,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepTitle: {
    color: palette.ink,
    fontWeight: '800',
  },
  addStepButton: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepLabel: {
    color: palette.sage,
    fontWeight: '800',
  },
  saveButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  saveButtonText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 16,
  },
});
