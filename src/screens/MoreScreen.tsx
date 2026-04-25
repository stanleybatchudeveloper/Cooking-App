import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { palette } from '../theme/tokens';

const sampleIdeas = [
  'Pantry Challenge mode',
  'Budget meal planner',
  'Leftover remix generator',
  'Family-size scaling assistant',
];

export function MoreScreen() {
  const {
    myRecipes,
    shoppingItems,
    toggleShoppingItem,
    generateShoppingListFromRecipes,
  } = useApp();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const showToast = (message: string) => {
    setSnackbar(message);
    setTimeout(() => setSnackbar(null), 2200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>More</Text>
        <Text style={styles.pageSubtitle}>Helpful tools and upcoming ideas in one place.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Shopping Helper</Text>
          <Text style={styles.cardText}>
            Generate a checklist from your recipes, then tap an item to mark it done.
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={async () => {
              await generateShoppingListFromRecipes(myRecipes);
              showToast('Shopping list generated');
            }}
          >
            <Text style={styles.primaryButtonText}>Generate From My Recipes</Text>
          </Pressable>

          <View style={styles.listWrap}>
            {shoppingItems.length ? (
              shoppingItems.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => toggleShoppingItem(item)}
                  style={styles.listItem}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color={palette.sage} />
                  <Text style={styles.listText}>{item}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>No shopping items yet.</Text>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sample Ideas</Text>
          <Text style={styles.cardText}>Quick placeholders you can expand later.</Text>
          {sampleIdeas.map((idea) => (
            <View key={idea} style={styles.ideaRow}>
              <Ionicons name="bulb-outline" size={16} color={palette.orange} />
              <Text style={styles.ideaText}>{idea}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {snackbar ? (
        <View style={styles.snackbarWrap} pointerEvents="none">
          <View style={styles.snackbar}>
            <Text style={styles.snackbarText}>{snackbar}</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 30,
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
  card: {
    marginTop: 16,
    backgroundColor: palette.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
  },
  cardTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  cardText: {
    marginTop: 6,
    color: palette.muted,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: palette.sage,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.white,
    fontWeight: '800',
  },
  listWrap: {
    marginTop: 12,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.paper,
    borderRadius: 12,
    padding: 12,
  },
  listText: {
    color: palette.ink,
    flex: 1,
  },
  emptyText: {
    color: palette.muted,
    lineHeight: 20,
  },
  ideaRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.paper,
    borderRadius: 12,
    padding: 10,
  },
  ideaText: {
    color: palette.ink,
    fontWeight: '600',
  },
  snackbarWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    alignItems: 'center',
  },
  snackbar: {
    backgroundColor: '#1F2E24',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  snackbarText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
