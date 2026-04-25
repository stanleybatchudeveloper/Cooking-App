import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/tokens';
import type { Recipe } from '../types/models';

type RecipeCardProps = {
  recipe: Recipe;
  showAuthor?: boolean;
  selectable?: boolean;
  selected?: boolean;
  showPublicToggle?: boolean;
  showMoreButton?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFavorite: () => void;
  onTogglePublic?: () => void;
  onAuthorPress?: () => void;
  onMorePress?: () => void;
};

export function RecipeCard({
  recipe,
  showAuthor = false,
  selectable = false,
  selected = false,
  showPublicToggle = false,
  showMoreButton = false,
  onPress,
  onLongPress,
  onToggleFavorite,
  onTogglePublic,
  onAuthorPress,
  onMorePress,
}: RecipeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, selected ? styles.selectedCard : undefined]}
    >
      <View style={styles.media}>
        {recipe.imageUrl ? (
          <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="restaurant-outline" size={30} color={palette.sage} />
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.category}>{recipe.category}</Text>
          <View style={styles.topRightActions}>
            {showPublicToggle ? (
              <Pressable onPress={onTogglePublic} style={styles.visibilityPill}>
                <Ionicons
                  name={recipe.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                  size={14}
                  color={recipe.isPublic ? palette.sage : palette.muted}
                />
                <Text style={styles.visibilityText}>
                  {recipe.isPublic ? 'Public' : 'Private'}
                </Text>
              </Pressable>
            ) : null}
            {showMoreButton ? (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onMorePress?.();
                }}
                hitSlop={8}
                style={styles.moreButton}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={styles.title}>{recipe.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description || 'No description yet.'}
        </Text>

        {showAuthor ? (
          <Pressable onPress={onAuthorPress} style={styles.authorPill}>
            <Ionicons name="person-outline" size={14} color={palette.sage} />
            <Text style={styles.authorText}>by @{recipe.userId.split('@')[0]}</Text>
          </Pressable>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={palette.muted} />
            <Text style={styles.metaText}>{recipe.prepTime || '15'}m</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color={palette.muted} />
            <Text style={styles.metaText}>{recipe.servings || '2'}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color={palette.gold} />
            <Text style={styles.metaText}>
              {recipe.ratingsCount ? recipe.averageRating.toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.counts}>
            <Text style={styles.countText}>{recipe.likesCount} likes</Text>
            <Text style={styles.countText}>{recipe.commentsCount} comments</Text>
          </View>
          <Pressable onPress={onToggleFavorite}>
            <Ionicons
              name={recipe.isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={recipe.isFavorite ? palette.danger : palette.muted}
            />
          </Pressable>
        </View>
      </View>

      {selectable && selected ? (
        <View style={styles.selectionBadge}>
          <Ionicons name="checkmark-circle" size={22} color={palette.sage} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: palette.line,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  selectedCard: {
    borderColor: palette.sage,
    backgroundColor: '#F4FAF5',
  },
  media: {
    width: 110,
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: 110,
    borderRadius: 22,
  },
  imageFallback: {
    width: '100%',
    height: 110,
    borderRadius: 22,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
  },
  category: {
    color: palette.sage,
    fontWeight: '800',
    fontSize: 12,
  },
  title: {
    marginTop: 6,
    fontSize: 19,
    fontWeight: '800',
    color: palette.ink,
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: palette.muted,
  },
  authorPill: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#EEF6EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  authorText: {
    color: palette.sage,
    fontWeight: '700',
    fontSize: 12,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counts: {
    flexDirection: 'row',
    gap: 10,
  },
  countText: {
    color: palette.muted,
    fontSize: 12,
  },
  visibilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: palette.cream,
    borderRadius: 999,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: palette.muted,
  },
  selectionBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});
