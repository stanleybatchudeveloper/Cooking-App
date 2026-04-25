import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '../theme/tokens';

type TagChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ label, selected = false, onPress }: TagChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        selected ? styles.selectedChip : undefined,
        !onPress ? styles.passiveChip : undefined,
      ]}
    >
      <Text style={[styles.label, selected ? styles.selectedLabel : undefined]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  passiveChip: {
    opacity: 0.9,
  },
  selectedChip: {
    backgroundColor: palette.sage,
    borderColor: palette.sage,
  },
  label: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  selectedLabel: {
    color: palette.white,
  },
});
