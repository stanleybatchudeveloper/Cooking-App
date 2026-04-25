import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithCredential,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';

import { analyzeRecipeUrl } from '../lib/ai';
import { auth, firestore, googleProvider, storage } from '../lib/firebase';
import { localStore, storageKeys } from '../lib/storage';
import type {
  AiRecipeResponse,
  AppNotification,
  Comment,
  Recipe,
  RecipeVersion,
  SaveRecipeInput,
} from '../types/models';
import { emptyRecipe, ingredientLines } from '../utils/recipe';

type AppContextValue = {
  user: User | null;
  myRecipes: Recipe[];
  exploreRecipes: Recipe[];
  userRecipes: Recipe[];
  notifications: AppNotification[];
  commentsByRecipe: Record<string, Comment[]>;
  likedRecipeIds: Record<string, boolean>;
  pantryItems: string[];
  shoppingItems: string[];
  mealPlan: Record<string, string>;
  recipeVersions: Record<string, RecipeVersion[]>;
  isBusy: boolean;
  isAiAnalyzing: boolean;
  authBusy: boolean;
  error: string | null;
  aiImportData: AiRecipeResponse | null;
  signInWithGoogle: (idToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRecipes: () => Promise<void>;
  loadUserRecipes: (userId: string) => Promise<void>;
  saveRecipe: (payload: SaveRecipeInput) => Promise<void>;
  deleteRecipes: (ids: string[]) => Promise<void>;
  toggleFavorite: (recipe: Recipe) => Promise<void>;
  togglePublic: (recipe: Recipe) => Promise<void>;
  toggleLike: (recipeId: string, liked: boolean) => Promise<void>;
  checkIfLiked: (recipeId: string) => Promise<void>;
  loadComments: (recipeId: string) => Promise<void>;
  addComment: (recipeId: string, text: string) => Promise<void>;
  submitRating: (recipeId: string, rating: number) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  analyzeUrl: (url: string) => Promise<void>;
  clearAiImport: () => void;
  togglePantryItem: (item: string) => Promise<void>;
  toggleShoppingItem: (item: string) => Promise<void>;
  generateShoppingListFromRecipes: (recipes: Recipe[]) => Promise<void>;
  setMealPlan: (day: string, recipeId: string) => Promise<void>;
  loadRecipeVersions: (recipeId: string) => Promise<void>;
  restoreRecipeVersion: (recipeId: string, version: RecipeVersion) => Promise<void>;
  clearError: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const recipesCollection = collection(firestore, 'recipes');

const toMillis = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  return Date.now();
};

const userKey = (user: User | null) => (user ? user.email ?? user.uid : '');

const normalizeRecipe = (
  id: string,
  raw: Record<string, unknown>,
  favoriteIds: Set<string>,
  userRating = 0,
): Recipe => ({
  ...emptyRecipe(),
  id,
  title: String(raw.title ?? ''),
  description: String(raw.description ?? ''),
  ingredients: String(raw.ingredients ?? ''),
  instructions: String(raw.instructions ?? ''),
  imageUrl: String(raw.imageUrl ?? ''),
  category: String(raw.category ?? 'Lunch'),
  prepTime: String(raw.prepTime ?? ''),
  cookTime: String(raw.cookTime ?? ''),
  servings: String(raw.servings ?? ''),
  difficulty: String(raw.difficulty ?? 'Easy'),
  userId: String(raw.userId ?? ''),
  timestamp: toMillis(raw.timestamp),
  isFavorite: favoriteIds.has(id),
  isPublic: Boolean(raw.isPublic ?? false),
  likesCount: Number(raw.likesCount ?? 0),
  commentsCount: Number(raw.commentsCount ?? 0),
  favoritesCount: Number(raw.favoritesCount ?? 0),
  averageRating: Number(raw.averageRating ?? 0),
  ratingsCount: Number(raw.ratingsCount ?? 0),
  dietTags: Array.isArray(raw.dietTags) ? raw.dietTags.map(String) : [],
  allergyTags: Array.isArray(raw.allergyTags) ? raw.allergyTags.map(String) : [],
  calories: Number(raw.calories ?? 0),
  proteinGrams: Number(raw.proteinGrams ?? 0),
  carbsGrams: Number(raw.carbsGrams ?? 0),
  fatGrams: Number(raw.fatGrams ?? 0),
  userRating,
});

const readRecipeVersions = async () =>
  localStore.readJson<Record<string, RecipeVersion[]>>(storageKeys.recipeVersions, {});

const saveRecipeVersions = async (value: Record<string, RecipeVersion[]>) => {
  await localStore.writeJson(storageKeys.recipeVersions, value);
};

const uploadImageAsync = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `recipe_images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const imageRef = ref(storage, path);
  await uploadBytes(imageRef, blob);
  return getDownloadURL(imageRef);
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [exploreRecipes, setExploreRecipes] = useState<Recipe[]>([]);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [commentsByRecipe, setCommentsByRecipe] = useState<Record<string, Comment[]>>({});
  const [likedRecipeIds, setLikedRecipeIds] = useState<Record<string, boolean>>({});
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [shoppingItems, setShoppingItems] = useState<string[]>([]);
  const [mealPlan, setMealPlanState] = useState<Record<string, string>>({});
  const [recipeVersions, setRecipeVersions] = useState<Record<string, RecipeVersion[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiImportData, setAiImportData] = useState<AiRecipeResponse | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setPantryItems(await localStore.readJson<string[]>(storageKeys.pantryItems, []));
      setShoppingItems(
        await localStore.readJson<string[]>(storageKeys.shoppingItems, []),
      );
      setMealPlanState(
        await localStore.readJson<Record<string, string>>(storageKeys.mealPlan, {}),
      );
      setRecipeVersions(await readRecipeVersions());
      setIsBusy(false);
    });

    return unsubscribe;
  }, []);

  const loadFavorites = useCallback(async (currentUser: User) => {
    const identifier = userKey(currentUser);
    const snapshot = await getDocs(
      collection(firestore, 'users', identifier, 'favorites'),
    );
    return new Set(snapshot.docs.map((item) => item.id));
  }, []);

  const getUserRating = useCallback(
    async (recipeId: string, currentUser: User) => {
      const identifier = userKey(currentUser);
      const ratingDoc = await getDoc(
        doc(firestore, 'recipes', recipeId, 'ratings', identifier),
      );
      return Number(ratingDoc.data()?.rating ?? 0);
    },
    [],
  );

  const hydrateRecipeList = useCallback(
    async (
      docs: Array<{ id: string; data: () => Record<string, unknown> }>,
      currentUser: User,
      favoriteIds: Set<string>,
    ) => {
      const recipes = await Promise.all(
        docs.map(async (item) =>
          normalizeRecipe(
            item.id,
            item.data(),
            favoriteIds,
            await getUserRating(item.id, currentUser),
          ),
        ),
      );
      return recipes.sort((a, b) => b.timestamp - a.timestamp);
    },
    [getUserRating],
  );

  const refreshRecipes = useCallback(async () => {
    if (!auth.currentUser) {
      setMyRecipes([]);
      setExploreRecipes([]);
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      const currentUser = auth.currentUser;
      const identifier = userKey(currentUser);
      const favoriteIds = await loadFavorites(currentUser);

      const mySnapshot = await getDocs(
        query(recipesCollection, where('userId', '==', identifier)),
      );
      const exploreSnapshot = await getDocs(
        query(recipesCollection, where('isPublic', '==', true)),
      );

      const nextMyRecipes = await hydrateRecipeList(
        mySnapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>,
        currentUser,
        favoriteIds,
      );
      const nextExploreRecipes = (
        await hydrateRecipeList(
          exploreSnapshot.docs as Array<{
            id: string;
            data: () => Record<string, unknown>;
          }>,
          currentUser,
          favoriteIds,
        )
      ).filter((item) => item.userId !== identifier);

      setMyRecipes(nextMyRecipes);
      setExploreRecipes(nextExploreRecipes);
      await Promise.all([
        localStore.writeJson(storageKeys.myRecipes, nextMyRecipes),
        localStore.writeJson(storageKeys.exploreRecipes, nextExploreRecipes),
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load recipes right now.',
      );
      setMyRecipes(await localStore.readJson(storageKeys.myRecipes, []));
      setExploreRecipes(await localStore.readJson(storageKeys.exploreRecipes, []));
    } finally {
      setIsBusy(false);
    }
  }, [hydrateRecipeList, loadFavorites]);

  const loadNotifications = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const identifier = userKey(auth.currentUser);
      const snapshot = await getDocs(
        query(
          collection(firestore, 'users', identifier, 'notifications'),
          orderBy('timestamp', 'desc'),
          limit(50),
        ),
      );
      setNotifications(
        snapshot.docs.map((item) => ({
          id: item.id,
          toUserId: String(item.data().toUserId ?? ''),
          fromUserId: String(item.data().fromUserId ?? ''),
          fromUserName: String(item.data().fromUserName ?? ''),
          recipeId: String(item.data().recipeId ?? ''),
          recipeTitle: String(item.data().recipeTitle ?? ''),
          type: String(item.data().type ?? ''),
          timestamp: toMillis(item.data().timestamp),
          isRead: Boolean(item.data().isRead ?? false),
        })),
      );
    } catch {
      setNotifications([]);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setMyRecipes([]);
      setExploreRecipes([]);
      setUserRecipes([]);
      setNotifications([]);
      return;
    }

    refreshRecipes().catch(() => undefined);
    loadNotifications().catch(() => undefined);
  }, [user, refreshRecipes, loadNotifications]);

  const signInWithGoogle = useCallback(async (idToken?: string) => {
    setAuthBusy(true);
    setError(null);

    try {
      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
      } else if (Platform.OS === 'web') {
        await signInWithPopup(auth, googleProvider);
      } else {
        throw new Error('Google sign-in is waiting for the Expo auth response.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sign-in failed.');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const loadUserRecipes = useCallback(
    async (targetUserId: string) => {
      if (!auth.currentUser) return;
      setIsBusy(true);
      try {
        const favoriteIds = await loadFavorites(auth.currentUser);
        const snapshot = await getDocs(
          query(
            recipesCollection,
            where('userId', '==', targetUserId),
            where('isPublic', '==', true),
          ),
        );
        const recipes = await hydrateRecipeList(
          snapshot.docs as Array<{ id: string; data: () => Record<string, unknown> }>,
          auth.currentUser,
          favoriteIds,
        );
        setUserRecipes(recipes);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to load user recipes.',
        );
        setUserRecipes([]);
      } finally {
        setIsBusy(false);
      }
    },
    [hydrateRecipeList, loadFavorites],
  );

  const saveRecipe = useCallback(
    async (payload: SaveRecipeInput) => {
      if (!auth.currentUser) return;

      setIsBusy(true);
      setError(null);

      try {
        const identifier = userKey(auth.currentUser);
        const existing =
          myRecipes.find((item) => item.id === payload.recipeId) ??
          exploreRecipes.find((item) => item.id === payload.recipeId);

        if (existing) {
          const history = await readRecipeVersions();
          const nextHistory = {
            ...history,
            [existing.id]: [
              ...(history[existing.id] ?? []),
              {
                title: existing.title,
                description: existing.description,
                ingredients: existing.ingredients,
                instructions: existing.instructions,
                category: existing.category,
                difficulty: existing.difficulty,
                prepTime: existing.prepTime,
                cookTime: existing.cookTime,
                servings: existing.servings,
                timestamp: Date.now(),
              },
            ].slice(-20),
          };
          setRecipeVersions(nextHistory);
          await saveRecipeVersions(nextHistory);
        }

        let imageUrl = existing?.imageUrl ?? '';
        if (payload.imageUri) {
          imageUrl = await uploadImageAsync(payload.imageUri);
        }

        const recipeRef = payload.recipeId
          ? doc(firestore, 'recipes', payload.recipeId)
          : doc(recipesCollection);

        const data = {
          id: recipeRef.id,
          title: payload.title,
          description: payload.description,
          ingredients: payload.ingredients,
          instructions: payload.instructions,
          imageUrl,
          category: payload.category,
          prepTime: payload.prepTime,
          cookTime: payload.cookTime,
          servings: payload.servings,
          difficulty: payload.difficulty,
          userId: identifier,
          isPublic: payload.isPublic,
          likesCount: existing?.likesCount ?? 0,
          commentsCount: existing?.commentsCount ?? 0,
          favoritesCount: existing?.favoritesCount ?? 0,
          averageRating: existing?.averageRating ?? 0,
          ratingsCount: existing?.ratingsCount ?? 0,
          dietTags: payload.dietTags,
          allergyTags: payload.allergyTags,
          calories: payload.calories,
          proteinGrams: payload.proteinGrams,
          carbsGrams: payload.carbsGrams,
          fatGrams: payload.fatGrams,
          timestamp: existing?.timestamp ? new Date(existing.timestamp) : serverTimestamp(),
        };

        await setDoc(recipeRef, data, { merge: true });
        await localStore.remove(storageKeys.addRecipeDraft);
        await refreshRecipes();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to save recipe.');
      } finally {
        setIsBusy(false);
      }
    },
    [exploreRecipes, myRecipes, refreshRecipes],
  );

  const deleteRecipes = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return;
      setIsBusy(true);
      try {
        await Promise.all(
          ids.map(async (id) => {
            const recipe = myRecipes.find((item) => item.id === id);
            if (recipe?.imageUrl.includes('firebasestorage')) {
              try {
                await deleteObject(ref(storage, recipe.imageUrl));
              } catch {
                // Keep delete resilient; the document delete matters more here.
              }
            }
            await deleteDoc(doc(firestore, 'recipes', id));
          }),
        );
        await refreshRecipes();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to delete recipes.');
      } finally {
        setIsBusy(false);
      }
    },
    [myRecipes, refreshRecipes],
  );

  const toggleFavorite = useCallback(
    async (recipe: Recipe) => {
      if (!auth.currentUser) return;

      const identifier = userKey(auth.currentUser);
      const recipeRef = doc(firestore, 'recipes', recipe.id);
      const favoriteRef = doc(firestore, 'users', identifier, 'favorites', recipe.id);

      try {
        await runTransaction(firestore, async (transaction) => {
          const snapshot = await transaction.get(recipeRef);
          const currentFavorites = Number(snapshot.data()?.favoritesCount ?? 0);
          const nextValue = !recipe.isFavorite;
          if (nextValue) {
            transaction.set(favoriteRef, { favoritedAt: new Date() });
            transaction.update(recipeRef, {
              favoritesCount: currentFavorites + 1,
            });
          } else {
            transaction.delete(favoriteRef);
            transaction.update(recipeRef, {
              favoritesCount: Math.max(currentFavorites - 1, 0),
            });
          }
        });
        await refreshRecipes();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to update favorite.');
      }
    },
    [refreshRecipes],
  );

  const togglePublic = useCallback(
    async (recipe: Recipe) => {
      try {
        await updateDoc(doc(firestore, 'recipes', recipe.id), {
          isPublic: !recipe.isPublic,
        });
        await refreshRecipes();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to change visibility.',
        );
      }
    },
    [refreshRecipes],
  );

  const checkIfLiked = useCallback(async (recipeId: string) => {
    if (!auth.currentUser) return;
    try {
      const identifier = userKey(auth.currentUser);
      const liked = (
        await getDoc(doc(firestore, 'recipes', recipeId, 'likes', identifier))
      ).exists();
      setLikedRecipeIds((current) => ({ ...current, [recipeId]: liked }));
    } catch {
      setLikedRecipeIds((current) => ({ ...current, [recipeId]: false }));
    }
  }, []);

  const toggleLike = useCallback(
    async (recipeId: string, liked: boolean) => {
      if (!auth.currentUser) return;

      const identifier = userKey(auth.currentUser);
      const userName = auth.currentUser.displayName ?? identifier.split('@')[0];
      const recipeRef = doc(firestore, 'recipes', recipeId);
      const likeRef = doc(firestore, 'recipes', recipeId, 'likes', identifier);

      try {
        await runTransaction(firestore, async (transaction) => {
          const snapshot = await transaction.get(recipeRef);
          const currentLikes = Number(snapshot.data()?.likesCount ?? 0);
          const authorId = String(snapshot.data()?.userId ?? '');
          const recipeTitle = String(snapshot.data()?.title ?? 'recipe');

          if (!liked) {
            transaction.set(likeRef, { timestamp: new Date() });
            transaction.update(recipeRef, { likesCount: currentLikes + 1 });

            if (authorId && authorId !== identifier) {
              const notificationRef = doc(
                collection(firestore, 'users', authorId, 'notifications'),
              );
              transaction.set(notificationRef, {
                id: notificationRef.id,
                toUserId: authorId,
                fromUserId: identifier,
                fromUserName: userName,
                recipeId,
                recipeTitle,
                type: 'LIKE',
                timestamp: new Date(),
                isRead: false,
              });
            }
          } else {
            transaction.delete(likeRef);
            transaction.update(recipeRef, {
              likesCount: Math.max(currentLikes - 1, 0),
            });
          }
        });

        setLikedRecipeIds((current) => ({ ...current, [recipeId]: !liked }));
        await refreshRecipes();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to update like.');
      }
    },
    [refreshRecipes],
  );

  const loadComments = useCallback(async (recipeId: string) => {
    try {
      const snapshot = await getDocs(
        query(
          collection(firestore, 'recipes', recipeId, 'comments'),
          orderBy('timestamp', 'desc'),
        ),
      );
      setCommentsByRecipe((current) => ({
        ...current,
        [recipeId]: snapshot.docs.map((item) => ({
          id: item.id,
          userId: String(item.data().userId ?? ''),
          userName: String(item.data().userName ?? ''),
          text: String(item.data().text ?? ''),
          timestamp: toMillis(item.data().timestamp),
        })),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load comments.');
    }
  }, []);

  const addComment = useCallback(
    async (recipeId: string, text: string) => {
      if (!auth.currentUser || !text.trim()) return;

      const identifier = userKey(auth.currentUser);
      const userName = auth.currentUser.displayName ?? identifier.split('@')[0];
      const recipeRef = doc(firestore, 'recipes', recipeId);
      const commentRef = doc(collection(firestore, 'recipes', recipeId, 'comments'));

      try {
        await runTransaction(firestore, async (transaction) => {
          const snapshot = await transaction.get(recipeRef);
          const currentComments = Number(snapshot.data()?.commentsCount ?? 0);
          const authorId = String(snapshot.data()?.userId ?? '');
          const recipeTitle = String(snapshot.data()?.title ?? 'recipe');

          transaction.set(commentRef, {
            id: commentRef.id,
            userId: identifier,
            userName,
            text: text.trim(),
            timestamp: new Date(),
          });
          transaction.update(recipeRef, { commentsCount: currentComments + 1 });

          if (authorId && authorId !== identifier) {
            const notificationRef = doc(
              collection(firestore, 'users', authorId, 'notifications'),
            );
            transaction.set(notificationRef, {
              id: notificationRef.id,
              toUserId: authorId,
              fromUserId: identifier,
              fromUserName: userName,
              recipeId,
              recipeTitle,
              type: 'COMMENT',
              timestamp: new Date(),
              isRead: false,
            });
          }
        });

        await Promise.all([loadComments(recipeId), refreshRecipes()]);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to add comment.');
      }
    },
    [loadComments, refreshRecipes],
  );

  const submitRating = useCallback(
    async (recipeId: string, rating: number) => {
      if (!auth.currentUser) return;

      const identifier = userKey(auth.currentUser);
      const userName = auth.currentUser.displayName ?? identifier.split('@')[0];
      const recipeRef = doc(firestore, 'recipes', recipeId);
      const ratingRef = doc(firestore, 'recipes', recipeId, 'ratings', identifier);

      try {
        await runTransaction(firestore, async (transaction) => {
          const recipeSnap = await transaction.get(recipeRef);
          const ratingSnap = await transaction.get(ratingRef);
          const oldAverage = Number(recipeSnap.data()?.averageRating ?? 0);
          const oldCount = Number(recipeSnap.data()?.ratingsCount ?? 0);
          const authorId = String(recipeSnap.data()?.userId ?? '');
          const recipeTitle = String(recipeSnap.data()?.title ?? 'recipe');

          if (ratingSnap.exists()) {
            const oldRating = Number(ratingSnap.data()?.rating ?? 0);
            const newAverage = oldCount
              ? (oldAverage * oldCount - oldRating + rating) / oldCount
              : rating;
            transaction.set(ratingRef, { rating, timestamp: new Date() }, { merge: true });
            transaction.update(recipeRef, { averageRating: newAverage });
          } else {
            const nextCount = oldCount + 1;
            const nextAverage = (oldAverage * oldCount + rating) / nextCount;
            transaction.set(ratingRef, { rating, timestamp: new Date() });
            transaction.update(recipeRef, {
              averageRating: nextAverage,
              ratingsCount: nextCount,
            });

            if (authorId && authorId !== identifier) {
              const notificationRef = doc(
                collection(firestore, 'users', authorId, 'notifications'),
              );
              transaction.set(notificationRef, {
                id: notificationRef.id,
                toUserId: authorId,
                fromUserId: identifier,
                fromUserName: userName,
                recipeId,
                recipeTitle,
                type: 'RATING',
                timestamp: new Date(),
                isRead: false,
              });
            }
          }
        });
        await refreshRecipes();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to submit rating.');
      }
    },
    [refreshRecipes],
  );

  const markNotificationAsRead = useCallback(
    async (notificationId: string) => {
      if (!auth.currentUser) return;
      try {
        await updateDoc(
          doc(firestore, 'users', userKey(auth.currentUser), 'notifications', notificationId),
          { isRead: true },
        );
        await loadNotifications();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : 'Unable to update notification.',
        );
      }
    },
    [loadNotifications],
  );

  const clearNotifications = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const identifier = userKey(auth.currentUser);
      const snapshot = await getDocs(
        collection(firestore, 'users', identifier, 'notifications'),
      );
      await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
      setNotifications([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to clear notifications.');
    }
  }, []);

  const analyzeUrl = useCallback(async (url: string) => {
    if (!url.trim()) {
      setError('Please enter a recipe URL.');
      return;
    }

    setIsAiAnalyzing(true);
    setError(null);
    try {
      setAiImportData(await analyzeRecipeUrl(url.trim()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to analyze the URL.');
    } finally {
      setIsAiAnalyzing(false);
    }
  }, []);

  const clearAiImport = useCallback(() => setAiImportData(null), []);

  const togglePantryItem = useCallback(async (item: string) => {
    const cleaned = item.trim().toLowerCase();
    if (!cleaned) return;
    const next = pantryItems.includes(cleaned)
      ? pantryItems.filter((value) => value !== cleaned)
      : [...pantryItems, cleaned];
    setPantryItems(next);
    await localStore.writeJson(storageKeys.pantryItems, next);
  }, [pantryItems]);

  const toggleShoppingItem = useCallback(async (item: string) => {
    const cleaned = item.trim();
    const next = shoppingItems.includes(cleaned)
      ? shoppingItems.filter((value) => value !== cleaned)
      : [...shoppingItems, cleaned];
    setShoppingItems(next);
    await localStore.writeJson(storageKeys.shoppingItems, next);
  }, [shoppingItems]);

  const generateShoppingListFromRecipes = useCallback(
    async (recipes: Recipe[]) => {
      const ingredients = [...new Set(recipes.flatMap((recipe) => ingredientLines(recipe.ingredients)))];
      const next = ingredients.filter((ingredient) => {
        const normalized = ingredient.toLowerCase();
        return !pantryItems.some(
          (item) => normalized.includes(item) || item.includes(normalized),
        );
      });
      setShoppingItems(next);
      await localStore.writeJson(storageKeys.shoppingItems, next);
    },
    [pantryItems],
  );

  const setMealPlan = useCallback(
    async (day: string, recipeId: string) => {
      const next = { ...mealPlan };
      if (recipeId) next[day] = recipeId;
      else delete next[day];
      setMealPlanState(next);
      await localStore.writeJson(storageKeys.mealPlan, next);
    },
    [mealPlan],
  );

  const loadRecipeVersions = useCallback(async (recipeId: string) => {
    const saved = await readRecipeVersions();
    setRecipeVersions(saved);
    if (!saved[recipeId]) {
      setRecipeVersions((current) => ({ ...current, [recipeId]: [] }));
    }
  }, []);

  const restoreRecipeVersion = useCallback(
    async (recipeId: string, version: RecipeVersion) => {
      const existing = myRecipes.find((item) => item.id === recipeId);
      if (!existing) {
        Alert.alert('Recipe not found', 'Open the recipe from your own collection first.');
        return;
      }

      await saveRecipe({
        recipeId,
        title: version.title,
        description: version.description,
        ingredients: version.ingredients,
        instructions: version.instructions,
        category: version.category,
        prepTime: version.prepTime,
        cookTime: version.cookTime,
        servings: version.servings,
        difficulty: version.difficulty,
        isPublic: existing.isPublic,
        imageUri: null,
        dietTags: existing.dietTags,
        allergyTags: existing.allergyTags,
        calories: existing.calories,
        proteinGrams: existing.proteinGrams,
        carbsGrams: existing.carbsGrams,
        fatGrams: existing.fatGrams,
      });
    },
    [myRecipes, saveRecipe],
  );

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      myRecipes,
      exploreRecipes,
      userRecipes,
      notifications,
      commentsByRecipe,
      likedRecipeIds,
      pantryItems,
      shoppingItems,
      mealPlan,
      recipeVersions,
      isBusy,
      isAiAnalyzing,
      authBusy,
      error,
      aiImportData,
      signInWithGoogle,
      signOut,
      refreshRecipes,
      loadUserRecipes,
      saveRecipe,
      deleteRecipes,
      toggleFavorite,
      togglePublic,
      toggleLike,
      checkIfLiked,
      loadComments,
      addComment,
      submitRating,
      loadNotifications,
      markNotificationAsRead,
      clearNotifications,
      analyzeUrl,
      clearAiImport,
      togglePantryItem,
      toggleShoppingItem,
      generateShoppingListFromRecipes,
      setMealPlan,
      loadRecipeVersions,
      restoreRecipeVersion,
      clearError,
    }),
    [
      aiImportData,
      authBusy,
      commentsByRecipe,
      error,
      exploreRecipes,
      isAiAnalyzing,
      isBusy,
      likedRecipeIds,
      mealPlan,
      myRecipes,
      notifications,
      pantryItems,
      recipeVersions,
      shoppingItems,
      signInWithGoogle,
      signOut,
      refreshRecipes,
      loadUserRecipes,
      saveRecipe,
      deleteRecipes,
      toggleFavorite,
      togglePublic,
      toggleLike,
      checkIfLiked,
      loadComments,
      addComment,
      submitRating,
      loadNotifications,
      markNotificationAsRead,
      clearNotifications,
      analyzeUrl,
      clearAiImport,
      togglePantryItem,
      toggleShoppingItem,
      generateShoppingListFromRecipes,
      setMealPlan,
      loadRecipeVersions,
      restoreRecipeVersion,
      clearError,
      user,
      userRecipes,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider.');
  }
  return context;
};
