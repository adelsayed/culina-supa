import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { amplifyClient, isAmplifyReady } from '../lib/amplify';

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

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

export default function AppLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
