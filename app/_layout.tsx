import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { amplifyClient, isAmplifyReady } from '../lib/amplify';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const initAmplify = async () => {
      try {
        const ready = await isAmplifyReady();
        if (ready && amplifyClient?.models) {
          console.log('Available amplifyClient.models:', Object.keys(amplifyClient.models));
        }
      } catch (err) {
        console.error('Error initializing Amplify:', err);
      }
    };

    initAmplify();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (session && inAuthGroup) {
      // User is signed in and in auth group, redirect to main app
      router.replace('/(tabs)/recipes');
    } else if (!session && !inAuthGroup) {
      // User is not signed in and not in auth group, redirect to sign in
      router.replace('/auth/sign-in');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default function AppLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
