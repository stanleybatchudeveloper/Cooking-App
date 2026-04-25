import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  ActivityIndicator,
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

export function AiImportScreen() {
  const navigation = useNavigation();
  const { analyzeUrl, aiImportData, isAiAnalyzing, error } = useApp();
  const [url, setUrl] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Recipe Import</Text>
        <Text style={styles.subtitle}>
          Paste a recipe page or video URL and we’ll shape it into an editable recipe
          draft for the React Native app.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Recipe URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://youtube.com/..."
            placeholderTextColor="#9AA39C"
            style={styles.input}
            autoCapitalize="none"
          />

          <Pressable
            style={styles.button}
            onPress={() => analyzeUrl(url)}
            disabled={isAiAnalyzing}
          >
            {isAiAnalyzing ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.buttonText}>Summarize Recipe</Text>
            )}
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Result Summary</Text>
          {aiImportData ? (
            <>
              <Text style={styles.recipeTitle}>{aiImportData.title}</Text>
              <Text style={styles.recipeDescription}>{aiImportData.description}</Text>

              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.blockText}>{aiImportData.ingredients}</Text>

              <Text style={styles.sectionTitle}>Instructions</Text>
              <Text style={styles.blockText}>{aiImportData.instructions}</Text>

              <Pressable
                style={[styles.button, styles.secondaryButton]}
                onPress={() =>
                  (navigation as any).navigate('MainTabs', { screen: 'Add' })
                }
              >
                <Text style={styles.secondaryButtonText}>Open Add Recipe Tab</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.placeholder}>
              Your imported recipe summary will appear here.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: palette.muted,
    lineHeight: 21,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
  },
  label: {
    color: palette.ink,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
    paddingHorizontal: 16,
    color: palette.ink,
  },
  button: {
    marginTop: 14,
    height: 54,
    borderRadius: 16,
    backgroundColor: palette.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: palette.white,
    fontSize: 15,
    fontWeight: '800',
  },
  error: {
    marginTop: 10,
    color: palette.danger,
  },
  resultCard: {
    backgroundColor: palette.white,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.line,
  },
  resultTitle: {
    color: palette.sage,
    fontWeight: '800',
    fontSize: 18,
  },
  recipeTitle: {
    marginTop: 12,
    color: palette.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  recipeDescription: {
    marginTop: 8,
    color: palette.muted,
    lineHeight: 20,
  },
  sectionTitle: {
    marginTop: 16,
    color: palette.ink,
    fontWeight: '800',
  },
  blockText: {
    marginTop: 6,
    color: palette.muted,
    lineHeight: 21,
  },
  secondaryButton: {
    backgroundColor: palette.orange,
  },
  secondaryButtonText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 15,
  },
  placeholder: {
    marginTop: 12,
    color: '#98A09B',
    lineHeight: 20,
  },
});
