import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { palette } from '../theme/tokens';
import { useApp } from '../context/AppContext';
import { AddRecipeScreen } from '../screens/AddRecipeScreen';
import { AiImportScreen } from '../screens/AiImportScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { RecipeFeedScreen } from '../screens/RecipeFeedScreen';
import { StartScreen } from '../screens/StartScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';

export type RootStackParamList = {
  Start: undefined;
  MainTabs: undefined;
  RecipeDetail: { recipeId: string };
  UserProfile: { userId: string; userName: string };
  RecipeEditor: { recipeId?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.sage,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.paper,
          borderTopColor: palette.line,
          paddingTop: 8,
          height: 72,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          marginBottom: 8,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName = {
            MyRecipes: 'restaurant-outline',
            Explore: 'compass-outline',
            Add: 'add-circle-outline',
            AIImport: 'sparkles-outline',
            Favorites: 'heart-outline',
          }[route.name] as keyof typeof Ionicons.glyphMap;

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="MyRecipes">
        {() => <RecipeFeedScreen mode="my" />}
      </Tabs.Screen>
      <Tabs.Screen name="Explore">
        {() => <RecipeFeedScreen mode="explore" />}
      </Tabs.Screen>
      <Tabs.Screen name="Add">
        {() => <AddRecipeScreen embedded />}
      </Tabs.Screen>
      <Tabs.Screen
        name="AIImport"
        component={AiImportScreen}
        options={{ title: 'AI Import' }}
      />
      <Tabs.Screen name="Favorites">
        {() => <RecipeFeedScreen mode="favorites" />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { user } = useApp();

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: palette.cream,
          card: palette.paper,
          primary: palette.sage,
          text: palette.ink,
          border: palette.line,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
            <Stack.Screen name="UserProfile" component={UserProfileScreen} />
            <Stack.Screen name="RecipeEditor">
              {({ route }) => <AddRecipeScreen recipeId={route.params?.recipeId} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Start" component={StartScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
