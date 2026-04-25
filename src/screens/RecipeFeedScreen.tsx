import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeCard } from '../components/RecipeCard';
import { TagChip } from '../components/TagChip';
import { UserAvatar } from '../components/UserAvatar';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/tokens';
import type { Recipe } from '../types/models';
import {
  allergyFilters,
  categories,
  dietFilters,
  mealPlanDays,
} from '../utils/recipe';

type RecipeFeedScreenProps = {
  mode: 'my' | 'explore' | 'favorites';
};

export function RecipeFeedScreen({ mode }: RecipeFeedScreenProps) {
  const navigation = useNavigation<any>();
  const {
    user,
    myRecipes,
    exploreRecipes,
    notifications,
    pantryItems,
    shoppingItems,
    mealPlan,
    isBusy,
    signOut,
    refreshRecipes,
    deleteRecipes,
    toggleFavorite,
    togglePublic,
    loadNotifications,
    markNotificationAsRead,
    clearNotifications,
    togglePantryItem,
    toggleShoppingItem,
    generateShoppingListFromRecipes,
    setMealPlan,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [selectedAllergy, setSelectedAllergy] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pantryInput, setPantryInput] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPantry, setShowPantry] = useState(false);

  const recipes = useMemo(() => {
    const base =
      mode === 'my'
        ? myRecipes
        : mode === 'explore'
          ? exploreRecipes
          : [...myRecipes, ...exploreRecipes].filter((item) => item.isFavorite);

    return base.filter((recipe) => {
      const categoryPass =
        selectedCategory === 'All' || recipe.category === selectedCategory;
      const dietPass =
        selectedDiet === 'All' ||
        recipe.dietTags.some(
          (item) => item.toLowerCase() === selectedDiet.toLowerCase(),
        );
      const allergyPass =
        selectedAllergy === 'All' ||
        !recipe.allergyTags.some(
          (item) => item.toLowerCase() === selectedAllergy.toLowerCase(),
        );
      const query = searchQuery.trim().toLowerCase();
      const searchPass =
        !query ||
        recipe.title.toLowerCase().includes(query) ||
        recipe.description.toLowerCase().includes(query);

      return categoryPass && dietPass && allergyPass && searchPass;
    });
  }, [
    exploreRecipes,
    mode,
    myRecipes,
    searchQuery,
    selectedAllergy,
    selectedCategory,
    selectedDiet,
  ]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const cycleMealPlan = async (day: string) => {
    const options = ['', ...myRecipes.map((recipe) => recipe.id)];
    const currentIndex = options.indexOf(mealPlan[day] ?? '');
    const nextId = options[(currentIndex + 1) % options.length] ?? '';
    await setMealPlan(day, nextId);
  };

  const pageTitle =
    mode === 'my'
      ? 'Your kitchen'
      : mode === 'explore'
        ? 'Community recipes'
        : 'Favorite dishes';

  const emptyTitle =
    mode === 'my'
      ? 'No recipes yet'
      : mode === 'explore'
        ? 'No public recipes yet'
        : 'No favorites yet';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
          <Text style={styles.pageSubtitle}>Your recipes, planning, and favorites in one place.</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() =>
              navigation.navigate('UserProfile', {
                userId: user?.email ?? user?.uid ?? '',
                userName: user?.displayName ?? 'Chef',
              })
            }
            style={styles.profileButton}
          >
            <UserAvatar
              name={user?.displayName}
              photoUrl={user?.photoURL}
              size={48}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              loadNotifications().catch(() => undefined);
              setShowNotifications(true);
            }}
            style={styles.iconButton}
          >
            <Ionicons name="notifications-outline" size={20} color={palette.ink} />
            {unreadCount ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
          {mode === 'my' ? (
            <Pressable onPress={() => setShowPantry(true)} style={styles.iconButton}>
              <Ionicons name="basket-outline" size={20} color={palette.ink} />
            </Pressable>
          ) : null}
          <Pressable onPress={() => signOut()} style={styles.iconButton}>
            <Ionicons name="log-out-outline" size={20} color={palette.ink} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={18} color={palette.muted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search recipes, flavors, categories..."
            placeholderTextColor="#99A49C"
          />
          <Pressable onPress={() => refreshRecipes()}>
            <Ionicons
              name={isBusy ? 'hourglass-outline' : 'refresh-outline'}
              size={18}
              color={palette.sage}
            />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {categories.map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={selectedCategory === item}
                onPress={() => setSelectedCategory(item)}
              />
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {dietFilters.map((item) => (
              <TagChip
                key={item}
                label={item}
                selected={selectedDiet === item}
                onPress={() => setSelectedDiet(item)}
              />
            ))}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {allergyFilters.map((item) => (
              <TagChip
                key={item}
                label={item === 'All' ? item : `No ${item}`}
                selected={selectedAllergy === item}
                onPress={() => setSelectedAllergy(item)}
              />
            ))}
          </View>
        </ScrollView>

        {mode === 'my' ? (
          <View style={styles.utilityGrid}>
            <View style={styles.utilityCard}>
              <Text style={styles.utilityTitle}>Meal Planner</Text>
              <Text style={styles.utilityText}>
                Tap a day to cycle through your recipes and build a quick weekly plan.
              </Text>
              <View style={styles.planList}>
                {mealPlanDays.map((day) => {
                  const assigned = myRecipes.find((recipe) => recipe.id === mealPlan[day]);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => cycleMealPlan(day)}
                      style={styles.dayRow}
                    >
                      <Text style={styles.dayLabel}>{day}</Text>
                      <Text style={styles.dayValue} numberOfLines={1}>
                        {assigned?.title ?? 'Unassigned'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.utilityCard}>
              <Text style={styles.utilityTitle}>Shopping Helper</Text>
              <Text style={styles.utilityText}>
                Build a shopping list from your saved recipes, then check items off.
              </Text>
              <Pressable
                style={styles.utilityButton}
                onPress={() => generateShoppingListFromRecipes(myRecipes)}
              >
                <Text style={styles.utilityButtonText}>Generate From My Recipes</Text>
              </Pressable>
              <View style={styles.shoppingList}>
                {shoppingItems.length ? (
                  shoppingItems.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => toggleShoppingItem(item)}
                      style={styles.shoppingItem}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={palette.sage}
                      />
                      <Text style={styles.shoppingText}>{item}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.emptySmall}>Your shopping list is empty.</Text>
                )}
              </View>
            </View>
          </View>
        ) : null}

        {selectedIds.length ? (
          <View style={styles.selectionBar}>
            <Text style={styles.selectionText}>{selectedIds.length} selected</Text>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteRecipes(selectedIds)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        ) : null}

        {recipes.length ? (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              selectable={mode === 'my'}
              selected={selectedIds.includes(recipe.id)}
              showPublicToggle={mode === 'my'}
              showAuthor={mode !== 'my'}
              onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
              onLongPress={
                mode === 'my'
                  ? () =>
                      setSelectedIds((current) =>
                        current.includes(recipe.id)
                          ? current.filter((item) => item !== recipe.id)
                          : [...current, recipe.id],
                      )
                  : undefined
              }
              onToggleFavorite={() => toggleFavorite(recipe)}
              onTogglePublic={() => togglePublic(recipe)}
              onAuthorPress={() =>
                navigation.navigate('UserProfile', {
                  userId: recipe.userId,
                  userName: recipe.userId.split('@')[0],
                })
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={48} color={palette.sage} />
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>
              Try changing filters or refresh after adding a recipe.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showNotifications} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <View style={styles.modalHeaderActions}>
              <Pressable onPress={() => clearNotifications()} style={styles.textButton}>
                <Text style={styles.textButtonLabel}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowNotifications(false)}
                style={styles.iconButton}
              >
                <Ionicons name="close" size={22} color={palette.ink} />
              </Pressable>
            </View>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            {notifications.length ? (
              notifications.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.notificationCard}
                  onPress={() => {
                    markNotificationAsRead(item.id).catch(() => undefined);
                    setShowNotifications(false);
                    navigation.navigate('RecipeDetail', { recipeId: item.recipeId });
                  }}
                >
                  <Text style={styles.notificationTitle}>
                    {item.fromUserName} sent a {item.type.toLowerCase()}
                  </Text>
                  <Text style={styles.notificationBody}>{item.recipeTitle}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptySmall}>No notifications right now.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={showPantry} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pantry & Shopping</Text>
            <Pressable onPress={() => setShowPantry(false)} style={styles.iconButton}>
              <Ionicons name="close" size={22} color={palette.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.searchCard}>
              <TextInput
                style={styles.searchInput}
                value={pantryInput}
                onChangeText={setPantryInput}
                placeholder="Add pantry item"
                placeholderTextColor="#99A49C"
              />
              <Pressable
                onPress={() => {
                  togglePantryItem(pantryInput).catch(() => undefined);
                  setPantryInput('');
                }}
              >
                <Ionicons name="add-circle" size={24} color={palette.sage} />
              </Pressable>
            </View>

            <Text style={styles.modalSectionTitle}>Pantry</Text>
            {pantryItems.length ? (
              pantryItems.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => togglePantryItem(item)}
                  style={styles.shoppingItem}
                >
                  <Ionicons
                    name="checkmark-done-outline"
                    size={18}
                    color={palette.sage}
                  />
                  <Text style={styles.shoppingText}>{item}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptySmall}>No pantry items saved yet.</Text>
            )}

            <Text style={styles.modalSectionTitle}>Shopping List</Text>
            {shoppingItems.length ? (
              shoppingItems.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleShoppingItem(item)}
                  style={styles.shoppingItem}
                >
                  <Ionicons
                    name="ellipse-outline"
                    size={18}
                    color={palette.orange}
                  />
                  <Text style={styles.shoppingText}>{item}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptySmall}>No shopping items yet.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  pageSubtitle: {
    marginTop: 6,
    color: palette.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  profileButton: {
    borderRadius: 24,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  searchCard: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  utilityGrid: {
    gap: 14,
    marginTop: 10,
    marginBottom: 18,
  },
  utilityCard: {
    backgroundColor: palette.white,
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
  },
  utilityTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  utilityText: {
    marginTop: 6,
    color: palette.muted,
    lineHeight: 20,
  },
  utilityButton: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: palette.sage,
    paddingVertical: 12,
    alignItems: 'center',
  },
  utilityButtonText: {
    color: palette.white,
    fontWeight: '800',
  },
  planList: {
    marginTop: 14,
    gap: 10,
  },
  dayRow: {
    borderRadius: 16,
    backgroundColor: palette.paper,
    padding: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  dayLabel: {
    color: palette.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  dayValue: {
    marginTop: 4,
    color: palette.ink,
    fontWeight: '800',
  },
  shoppingList: {
    marginTop: 12,
    gap: 8,
  },
  shoppingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.paper,
    borderRadius: 14,
    padding: 12,
  },
  shoppingText: {
    color: palette.ink,
    flex: 1,
  },
  selectionBar: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#EEF6EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionText: {
    color: palette.sage,
    fontWeight: '800',
  },
  deleteButton: {
    borderRadius: 999,
    backgroundColor: palette.danger,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: palette.white,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    marginTop: 14,
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  emptySubtitle: {
    marginTop: 8,
    color: palette.muted,
    textAlign: 'center',
    lineHeight: 20,
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
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  textButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  textButtonLabel: {
    color: palette.orange,
    fontWeight: '800',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  notificationCard: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.line,
  },
  notificationTitle: {
    color: palette.ink,
    fontWeight: '800',
  },
  notificationBody: {
    marginTop: 6,
    color: palette.muted,
  },
  modalSectionTitle: {
    marginTop: 18,
    marginBottom: 10,
    color: palette.ink,
    fontWeight: '900',
    fontSize: 18,
  },
  emptySmall: {
    color: palette.muted,
    lineHeight: 20,
  },
});
