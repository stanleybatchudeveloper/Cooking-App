import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useApp } from '../context/AppContext';
import { googleAuthConfig } from '../lib/firebase';
import { palette } from '../theme/tokens';

export function StartScreen() {
  const { signInWithGoogle, authBusy, error, clearError } = useApp();
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleAuthConfig.webClientId,
    androidClientId: googleAuthConfig.androidClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      signInWithGoogle(idToken).catch(() => undefined);
    }
  }, [response, signInWithGoogle]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#FDF7EC', '#F5F0E6', '#EAF2EB']}
        style={styles.gradient}
      >
        <View style={styles.heroBubble} />
        <View style={styles.card}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>KR</Text>
          </View>
          <Text style={styles.title}>Kitchen Recipes</Text>
          <Text style={styles.subtitle}>
            A calmer, friendlier recipe studio for collecting, planning, and cooking
            on web and mobile.
          </Text>

          <Pressable
            disabled={authBusy}
            onPress={() => {
              clearError();
              if (Platform.OS === 'web') {
                signInWithGoogle().catch(() => undefined);
              } else if (request) {
                promptAsync().catch(() => undefined);
              } else {
                signInWithGoogle().catch(() => undefined);
              }
            }}
            style={({ pressed }) => [
              styles.button,
              pressed ? styles.buttonPressed : undefined,
            ]}
          >
            {authBusy ? (
              <ActivityIndicator color={palette.white} />
            ) : (
              <Text style={styles.buttonText}>Continue with Google</Text>
            )}
          </Pressable>

          <Text style={styles.helperText}>
            Browser-friendly now, Android-ready later through Expo builds.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroBubble: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#DDE9DE',
    top: 60,
    opacity: 0.8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(93,140,107,0.14)',
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.sage,
    alignSelf: 'center',
  },
  logoText: {
    color: palette.white,
    fontWeight: '900',
    fontSize: 24,
  },
  title: {
    marginTop: 28,
    textAlign: 'center',
    color: palette.ink,
    fontSize: 32,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 14,
    textAlign: 'center',
    color: palette.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 30,
    backgroundColor: palette.sage,
    borderRadius: 18,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.92,
  },
  buttonText: {
    color: palette.white,
    fontWeight: '800',
    fontSize: 16,
  },
  helperText: {
    marginTop: 16,
    textAlign: 'center',
    color: palette.muted,
    fontSize: 13,
  },
  errorText: {
    marginTop: 18,
    textAlign: 'center',
    color: palette.danger,
    fontSize: 13,
  },
});
