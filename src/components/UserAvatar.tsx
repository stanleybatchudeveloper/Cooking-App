import { Image, StyleSheet, Text, View } from 'react-native';

import { palette } from '../theme/tokens';

type UserAvatarProps = {
  name?: string | null;
  photoUrl?: string | null;
  size?: number;
  framed?: boolean;
};

export function UserAvatar({
  name,
  photoUrl,
  size = 44,
  framed = true,
}: UserAvatarProps) {
  const initials = (name ?? 'Kitchen Recipes')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const outerSize = framed ? size : Math.max(size - 4, 24);
  const innerSize = framed ? size - 6 : outerSize;

  return (
    <View
      style={[
        styles.outer,
        framed
          ? {
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          : {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              backgroundColor: 'transparent',
              padding: 0,
            },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize: Math.max(12, Math.round(innerSize * 0.34)),
              },
            ]}
          >
            {initials || 'KR'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#E8CBAE',
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: 'rgba(93,140,107,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: palette.sage,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
