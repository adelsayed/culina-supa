import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { initializeAmplify } from '../lib/amplify';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';

function InitialLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isAmplifyConfigured, setAmplifyConfigured] = useState(false);

  useEffect(() => {
    const configureAmplify = async () => {
      try {
        await initializeAmplify();
        setAmplifyConfigured(true);
        console.log('Amplify configured successfully from layout');
      } catch (err) {
        console.error('Error configuring Amplify:', err);
      }
    };

    configureAmplify();
  }, []);

  useEffect(() => {
    if (!isAmplifyConfigured || loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const isResetPassword = segments[1] === 'reset-password';

    // Check if user is in password recovery state (from email link)
    const isPasswordRecovery = session?.user?.recovery_sent_at;

    // If user is already on reset password screen, don't redirect
    if (isResetPassword && inAuthGroup) {
      return;
    }

    // If user has a session and is in password recovery state, redirect to reset password
    if (session && isPasswordRecovery && !isResetPassword) {
      console.log('User in recovery state, redirecting to reset password screen');
      router.replace('/auth/reset-password');
      return;
    }

    // Normal navigation logic - only redirect to recipes if NOT in recovery mode
    if (session && inAuthGroup && !isResetPassword && !isPasswordRecovery) {
      router.replace('/(tabs)/recipes');
    } else if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in');
    }
  }, [session, loading, segments, isAmplifyConfigured]);

  useEffect(() => {
    // Listen for Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.recovery_sent_at);
      
      if (event === 'PASSWORD_RECOVERY') {
        // Navigate to the password reset screen
        router.replace('/auth/reset-password');
      } else if (event === 'SIGNED_IN' && session?.user?.recovery_sent_at) {
        // User signed in via password recovery link
        router.replace('/auth/reset-password');
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    // On mount, check if the app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parsed = Linking.parse(url);
        console.log('Initial deep link:', parsed);
        if (parsed.path === 'auth/reset-password') {
          router.replace('/auth/reset-password');
        }
      }
    });
  }, []);

  useEffect(() => {
    // Listen for deep links while the app is running
    const handleDeepLink = ({ url }: { url: string }) => {
      if (url) {
        const parsed = Linking.parse(url);
        if (parsed.path === 'auth/reset-password') {
          router.replace('/auth/reset-password');
        }
      }
    };
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, [router]);

  if (!isAmplifyConfigured || loading) {
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
