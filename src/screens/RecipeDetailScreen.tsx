import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { palette } from '../theme/tokens';
import type { RecipeVersion } from '../types/models';
import { formatSeconds, ingredientLines, parseInstructions } from '../utils/recipe';

export function RecipeDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const recipeId = route.params?.recipeId as string;
  const {
    user,
    myRecipes,
    exploreRecipes,
    userRecipes,
    commentsByRecipe,
    likedRecipeIds,
    recipeVersions,
    toggleFavorite,
    toggleLike,
    checkIfLiked,
    loadComments,
    addComment,
    submitRating,
    loadRecipeVersions,
    restoreRecipeVersion,
  } = useApp();

  const recipe = useMemo(
    () =>
      [...myRecipes, ...exploreRecipes, ...userRecipes].find((item) => item.id === recipeId),
    [exploreRecipes, myRecipes, recipeId, userRecipes],
  );

  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [rating, setRating] = useState(recipe?.userRating ?? 0);

  useEffect(() => {
    if (!recipeId) return;
    loadComments(recipeId).catch(() => undefined);
    checkIfLiked(recipeId).catch(() => undefined);
    loadRecipeVersions(recipeId).catch(() => undefined);
  }, [checkIfLiked, loadComments, loadRecipeVersions, recipeId]);

  useEffect(() => {
    setRating(recipe?.userRating ?? 0);
  }, [recipe?.userRating]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Recipe not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canEdit = recipe.userId === (user?.email ?? user?.uid ?? '');
  const parsedSteps = parseInstructions(recipe.instructions);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          {recipe.imageUrl ? (
            <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroFallback}>
              <Ionicons name="restaurant-outline" size={54} color={palette.sage} />
            </View>
          )}
          <View style={styles.topActions}>
            <Pressable style={styles.overlayButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={palette.ink} />
            </Pressable>
            <View style={styles.actionGroup}>
              {canEdit ? (
                <Pressable
                  style={styles.overlayButton}
                  onPress={() => navigation.navigate('RecipeEditor', { recipeId: recipe.id })}
                >
                  <Ionicons name="create-outline" size={20} color={palette.ink} />
                </Pressable>
              ) : null}
              <Pressable
                style={styles.overlayButton}
                onPress={() => toggleFavorite(recipe)}
              >
                <Ionicons
                  name={recipe.isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={recipe.isFavorite ? palette.danger : palette.ink}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <View style={styles.badgeRow}>
            <Text style={styles.category}>{recipe.category}</Text>
            <Text style={styles.difficulty}>{recipe.difficulty}</Text>
          </View>

          <Text style={styles.title}>{recipe.title}</Text>
          <Pressable
            style={styles.authorPill}
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: recipe.userId,
                userName: recipe.userId.split('@')[0],
              })
            }
          >
            <Ionicons name="person-outline" size={14} color={palette.sage} />
            <Text style={styles.authorText}>by @{recipe.userId.split('@')[0]}</Text>
          </Pressable>

          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.statsRow}>
            <StatBlock icon="time-outline" label="Prep" value={`${recipe.prepTime || '15'} min`} />
            <StatBlock icon="flame-outline" label="Cook" value={`${recipe.cookTime || '20'} min`} />
            <StatBlock icon="people-outline" label="Servings" value={recipe.servings || '2'} />
          </View>

          <View style={styles.interactionBar}>
            <Pressable
              style={styles.interactionButton}
              onPress={() => toggleLike(recipe.id, Boolean(likedRecipeIds[recipe.id]))}
            >
              <Ionicons
                name={likedRecipeIds[recipe.id] ? 'thumbs-up' : 'thumbs-up-outline'}
                size={18}
                color={palette.sage}
              />
              <Text style={styles.interactionText}>{recipe.likesCount}</Text>
            </Pressable>
            <Pressable
              style={styles.interactionButton}
              onPress={() => setShowComments(true)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={palette.sage} />
              <Text style={styles.interactionText}>{recipe.commentsCount}</Text>
            </Pressable>
            <Pressable
              style={styles.interactionButton}
              onPress={() => {
                if (canEdit) setShowVersions(true);
                else Alert.alert('Version history', 'Only the author can restore recipe versions.');
              }}
            >
              <Ionicons name="time-outline" size={18} color={palette.sage} />
              <Text style={styles.interactionText}>History</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Rate this recipe</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => {
                  setRating(star);
                  submitRating(recipe.id, star).catch(() => undefined);
                }}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={28}
                  color={palette.gold}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Ingredients</Text>
          <View style={styles.panel}>
            {ingredientLines(recipe.ingredients).map((item, index) => (
              <View key={`${item}-${index}`} style={styles.listRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={palette.sage} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Cooking Steps</Text>
          <View style={styles.stepsWrap}>
            {parsedSteps.map((step) => (
              <StepCard
                key={step.index}
                index={step.index}
                text={step.text}
                timerSeconds={step.timerSeconds}
                specialNote={step.specialNote}
              />
            ))}
          </View>

          {(recipe.calories ||
            recipe.proteinGrams ||
            recipe.carbsGrams ||
            recipe.fatGrams) ? (
            <>
              <Text style={styles.sectionTitle}>Nutrition</Text>
              <View style={styles.panel}>
                <Text style={styles.nutritionText}>
                  {recipe.calories} kcal | Protein {recipe.proteinGrams}g | Carbs{' '}
                  {recipe.carbsGrams}g | Fat {recipe.fatGrams}g
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <Modal visible={showComments} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <Pressable style={styles.overlayButton} onPress={() => setShowComments(false)}>
              <Ionicons name="close" size={20} color={palette.ink} />
            </Pressable>
          </View>
          <View style={styles.commentComposer}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#98A19B"
            />
            <Pressable
              style={styles.sendButton}
              onPress={() => {
                addComment(recipe.id, commentText).catch(() => undefined);
                setCommentText('');
              }}
            >
              <Ionicons name="send" size={18} color={palette.white} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {(commentsByRecipe[recipe.id] ?? []).length ? (
              commentsByRecipe[recipe.id].map((item) => (
                <View key={item.id} style={styles.commentCard}>
                  <Text style={styles.commentAuthor}>{item.userName}</Text>
                  <Text style={styles.commentBody}>{item.text}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No comments yet.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showVersions} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recipe Versions</Text>
            <Pressable style={styles.overlayButton} onPress={() => setShowVersions(false)}>
              <Ionicons name="close" size={20} color={palette.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {(recipeVersions[recipe.id] ?? []).length ? (
              recipeVersions[recipe.id]
                .slice()
                .reverse()
                .map((version, index) => (
                  <VersionCard
                    key={`${version.timestamp}-${index}`}
                    version={version}
                    onPress={() => {
                      restoreRecipeVersion(recipe.id, version).catch(() => undefined);
                      setShowVersions(false);
                    }}
                  />
                ))
            ) : (
              <Text style={styles.emptyText}>No saved versions yet.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function StatBlock({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Ionicons name={icon} size={18} color={palette.sage} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StepCard({
  index,
  text,
  timerSeconds,
  specialNote,
}: {
  index: number;
  text: string;
  timerSeconds: number;
  specialNote: string;
}) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(timerSeconds);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timeout = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timeout);
  }, [remaining, running]);

  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepHeading}>Step {index + 1}</Text>
        {timerSeconds ? (
          <View style={styles.timerPill}>
            <Text style={styles.timerText}>{formatSeconds(remaining)}</Text>
            <Pressable onPress={() => setRunning((value) => !value)}>
              <Ionicons
                name={running ? 'pause' : 'play'}
                size={16}
                color={palette.sage}
              />
            </Pressable>
          </View>
        ) : null}
      </View>
      <Text style={styles.stepBody}>{text}</Text>
      {specialNote ? <Text style={styles.noteText}>Chef note: {specialNote}</Text> : null}
    </View>
  );
}

function VersionCard({
  version,
  onPress,
}: {
  version: RecipeVersion;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.versionCard} onPress={onPress}>
      <Text style={styles.versionTitle}>{version.title}</Text>
      <Text style={styles.versionMeta}>
        {new Date(version.timestamp).toLocaleString()}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    paddingBottom: 36,
  },
  hero: {
    height: 300,
    backgroundColor: palette.paper,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF6EF',
  },
  topActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  overlayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -28,
    backgroundColor: palette.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  category: {
    backgroundColor: '#EAF2EB',
    color: palette.sage,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  difficulty: {
    backgroundColor: '#F8E8D8',
    color: palette.orange,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  title: {
    marginTop: 16,
    color: palette.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  authorPill: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#EEF6EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authorText: {
    color: palette.sage,
    fontWeight: '800',
  },
  description: {
    marginTop: 14,
    color: palette.muted,
    lineHeight: 22,
  },
  statsRow: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 12,
  },
  statBlock: {
    flex: 1,
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.line,
  },
  statLabel: {
    marginTop: 8,
    color: palette.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  statValue: {
    marginTop: 4,
    color: palette.ink,
    fontWeight: '800',
  },
  interactionBar: {
    marginTop: 22,
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: palette.line,
  },
  interactionButton: {
    alignItems: 'center',
    gap: 6,
  },
  interactionText: {
    color: palette.muted,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  panel: {
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
  },
  listRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  listText: {
    color: palette.ink,
    flex: 1,
    lineHeight: 20,
  },
  stepsWrap: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: palette.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepHeading: {
    color: palette.sage,
    fontWeight: '900',
    fontSize: 16,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EEF6EF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  timerText: {
    color: palette.sage,
    fontWeight: '800',
  },
  stepBody: {
    marginTop: 10,
    color: palette.ink,
    lineHeight: 22,
  },
  noteText: {
    marginTop: 12,
    color: palette.orange,
    fontWeight: '700',
  },
  nutritionText: {
    color: palette.ink,
    lineHeight: 22,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  commentComposer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: 14,
    color: palette.ink,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 12,
  },
  commentAuthor: {
    color: palette.ink,
    fontWeight: '800',
  },
  commentBody: {
    marginTop: 8,
    color: palette.muted,
    lineHeight: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: palette.muted,
  },
  versionCard: {
    backgroundColor: palette.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 12,
  },
  versionTitle: {
    color: palette.ink,
    fontWeight: '800',
  },
  versionMeta: {
    marginTop: 6,
    color: palette.muted,
  },
});
