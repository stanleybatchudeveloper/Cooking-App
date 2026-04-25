import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RecipeCard } from '../components/RecipeCard';
import { UserAvatar } from '../components/UserAvatar';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/tokens';

export function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId = route.params?.userId as string;
  const userName = route.params?.userName as string;
  const { user, myRecipes, userRecipes, loadUserRecipes, toggleFavorite } = useApp();
  const isCurrentUser = userId === (user?.email ?? user?.uid ?? '');
  const recipesToShow = isCurrentUser ? myRecipes : userRecipes;

  useEffect(() => {
    if (!isCurrentUser) {
      loadUserRecipes(userId).catch(() => undefined);
    }
  }, [isCurrentUser, loadUserRecipes, userId]);

  const likes = recipesToShow.reduce((sum, recipe) => sum + recipe.likesCount, 0);
  const averageRating = recipesToShow.length
    ? recipesToShow.reduce((sum, recipe) => sum + recipe.averageRating, 0) /
      recipesToShow.length
    : 0;
  const displayName = isCurrentUser ? user?.displayName ?? userName : userName;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.heading}>{isCurrentUser ? 'My Profile' : 'Chef Profile'}</Text>
              <Text style={styles.subheading}>
                {isCurrentUser
                  ? 'Your connected Firebase identity and recipe space.'
                  : `Explore public recipes by @${displayName}`}
              </Text>
            </View>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={palette.white} />
            </Pressable>
          </View>

          <LinearGradient
            colors={['#FFF5E8', '#F2D4B8', '#E7B98A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarShadow}>
              <View style={styles.avatar}>
                <View style={styles.avatarGlow} />
                <View style={styles.avatarCore}>
                  <UserAvatar
                    name={displayName}
                    photoUrl={isCurrentUser ? user?.photoURL : null}
                    size={92}
                    framed={false}
                  />
                  <View style={styles.avatarMiniBadge}>
                    <Ionicons name="sparkles" size={12} color={palette.sage} />
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
          <Text style={styles.name}>{displayName.toUpperCase()}</Text>
          <Text style={styles.role}>{isCurrentUser ? 'CONNECTED CHEF' : 'COMMUNITY CHEF'}</Text>

          <View style={styles.statsRow}>
            <Stat label="Recipes" value={String(recipesToShow.length)} />
            <Stat label="Likes" value={String(likes)} />
            <Stat label="Rating" value={averageRating.toFixed(1)} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isCurrentUser ? 'Your Recipes' : `Recipes by ${displayName}`}
          </Text>
        </View>

        <View style={styles.listSection}>
          {recipesToShow.length ? (
            recipesToShow.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}
                onToggleFavorite={() => toggleFavorite(recipe)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={42} color={palette.sage} />
              <Text style={styles.emptyTitle}>No public recipes yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: palette.sage,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '900',
  },
  subheading: {
    marginTop: 6,
    color: '#E6F0E7',
  },
  avatarRing: {
    marginTop: 24,
    width: 144,
    height: 144,
    borderRadius: 72,
    padding: 6,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  avatarShadow: {
    flex: 1,
    borderRadius: 68,
    backgroundColor: 'rgba(255,255,255,0.18)',
    padding: 6,
  },
  avatar: {
    flex: 1,
    borderRadius: 62,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 10,
    left: 16,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  avatarCore: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93,140,107,0.12)',
    position: 'relative',
  },
  avatarMiniBadge: {
    position: 'absolute',
    right: 2,
    bottom: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF5E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(213,122,69,0.18)',
  },
  name: {
    marginTop: 18,
    alignSelf: 'center',
    color: palette.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  role: {
    marginTop: 8,
    alignSelf: 'center',
    color: '#ECF6ED',
    fontWeight: '700',
  },
  statsRow: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    paddingVertical: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    marginTop: 6,
    color: '#E6F0E7',
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  listSection: {
    paddingHorizontal: 20,
  },
  emptyState: {
    backgroundColor: palette.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    color: palette.muted,
    fontWeight: '700',
  },
});
