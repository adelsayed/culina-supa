import { Stack, useRootNavigationState, useSegments, router } from 'expo-router';
import { AuthProvider } from '../lib/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { View, ActivityIndicator, Text } from 'react-native';

function RootLayoutNav() {
  const segments = useSegments();
  const { session, loading, error, isInitialized } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    console.log('RootLayoutNav state:', {
      navigationKey: navigationState?.key,
      loading,
      isInitialized,
      session: !!session,
      segments,
      error
    });
  }, [navigationState?.key, loading, isInitialized, session, segments, error]);

  useEffect(() => {
    if (!navigationState?.key || loading || !isInitialized) return;

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    
    console.log('Navigation logic:', { session: !!session, inAuthGroup, inTabsGroup, segments });
    
    // Only redirect if user is not authenticated and not in auth group
    if (!session && !inAuthGroup) {
      console.log('Redirecting to sign-in - user not authenticated');
      router.replace('/auth/sign-in');
    } 
    // Only redirect if user is authenticated and in auth group (not in tabs)
    else if (session && inAuthGroup) {
      console.log('Redirecting to recipes - user authenticated but in auth group');
      router.replace('/(tabs)/recipes');
    }
    // Allow authenticated users to stay in tabs group and navigate freely
  }, [session, segments, navigationState?.key, loading, isInitialized]);

  if (!navigationState?.key || loading || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, color: '#666' }}>
          {!navigationState?.key ? 'Initializing navigation...' : 
           !isInitialized ? 'Initializing auth...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#FF4081', textAlign: 'center', marginBottom: 20 }}>
          Authentication Error
        </Text>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RootLayoutNav />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
