import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/RootNavigator';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const { width, height } = useWindowDimensions();
  const content = <RootNavigator />;
  const phoneWidth = Math.min(390, Math.max(320, width - 32));
  const phoneHeight = Math.min(844, Math.max(640, height - 48));

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        {Platform.OS === 'web' ? (
          <View style={styles.webBackdrop}>
            <View style={[styles.phoneShell, { width: phoneWidth, height: phoneHeight }]}>
              <View style={styles.notch} />
              <View style={styles.phoneFrame}>{content}</View>
            </View>
          </View>
        ) : (
          content
        )}
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webBackdrop: {
    flex: 1,
    backgroundColor: '#D8D0C2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  phoneShell: {
    borderRadius: 42,
    backgroundColor: '#121212',
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  notch: {
    position: 'absolute',
    top: 16,
    left: '50%',
    marginLeft: -48,
    width: 96,
    height: 20,
    borderRadius: 12,
    backgroundColor: '#222222',
    zIndex: 2,
  },
  phoneFrame: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#F8F3EA',
  },
});
