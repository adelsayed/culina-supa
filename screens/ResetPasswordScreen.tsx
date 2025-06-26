import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code and new password
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated with recovery session
    const checkExistingSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user?.recovery_sent_at) {
        console.log('ResetPasswordScreen: Found existing recovery session, setting step to 2');
        setStep(2);
        return true;
      }
      return false;
    };

    // Helper to process a URL for recovery
    const processRecoveryUrl = (url: string | null) => {
      if (url) {
        // Parse both query and hash fragments for Supabase tokens
        let params: Record<string, string> = {};
        try {
          const urlObj = new URL(url);
          // Query params
          urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
          });
          // Hash fragment (for some providers)
          if (urlObj.hash) {
            const hashParams = new URLSearchParams(urlObj.hash.replace(/^#/, ''));
            hashParams.forEach((value, key) => {
              params[key] = value;
            });
          }
        } catch {
          // fallback: try expo-linking parse
          const parsed = Linking.parse(url);
          if (parsed.queryParams) {
            // Convert all values to string (take first if array)
            Object.entries(parsed.queryParams).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                params[key] = value[0] ?? '';
              } else if (typeof value === 'string') {
                params[key] = value;
              }
            });
          }
        }
        if (params.type === 'recovery' && (params.access_token || params.token)) {
          setStep(2);
          const accessToken = params.access_token || params.token || '';
          const refreshToken = params.refresh_token || '';
          setToken(accessToken ?? '');
          supabase.auth.setSession({
            access_token: accessToken ?? '',
            refresh_token: refreshToken ?? ''
          }).then(({ error }) => {
            if (error) {
              console.error('Error setting Supabase session from recovery link:', error);
            }
          });
          if (params.email) setEmail(params.email ?? '');
          console.log('ResetPasswordScreen: Detected recovery deep link, setting step to 2');
          return true;
        } else {
          // Log the URL and params for debugging
          console.log('ResetPasswordScreen: No recovery token found in URL:', url, params);
          return false;
        }
      }
      return false;
    };

    // First check if we already have a recovery session
    checkExistingSession().then((hasRecoverySession) => {
      if (!hasRecoverySession) {
        // If no existing recovery session, check the initial URL
        Linking.getInitialURL().then(processRecoveryUrl);
      }
    });

    // Listen for deep link events while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processRecoveryUrl(url);
    });

    // Listen for Supabase PASSWORD_RECOVERY event
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStep(2);
        console.log('ResetPasswordScreen: PASSWORD_RECOVERY event detected, showing set new password UI');
      }
    });

    return () => {
      subscription.remove();
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'culina://auth/reset-password',
      });
      if (error) throw error;
      Alert.alert('Success', 'A password reset link has been sent to your email. Please check your inbox and follow the link to set a new password.');
      // Do not setStep(2) here; wait for the user to open the link from their email
    } catch (error: any) {
      console.error('Error requesting password reset code:', error);
      Alert.alert('Error', error.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your new password.');
      return;
    }
    setLoading(true);
    try {
      // Directly update the password using the session from the recovery link
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      Alert.alert('Success', 'Your password has been reset successfully. Please log in.');
      router.replace('/auth/sign-in');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      Alert.alert('Error', error.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      {step === 1 ? (
        <>
          <Text style={styles.label}>Enter your email to receive a reset link.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity style={styles.button} onPress={handleRequestCode} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send Reset Email'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter your new password.</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 20,
  },
  backLinkText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
}); 