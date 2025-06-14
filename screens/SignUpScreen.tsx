import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface SignUpScreenProps {
  onSignInPress: () => void;
}

export default function SignUpScreen({ onSignInPress }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setSignUpLoading(true);
      const { data: { session }, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      if (!session) Alert.alert('Please check your inbox for email verification!');
    } catch (error: any) {
      console.error('Error signing up:', error);
      Alert.alert('Error', error.message);
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.button, styles.signUpButton]}
        onPress={handleSignUp}
        disabled={signUpLoading}
      >
        <Text style={styles.buttonText}>
          {signUpLoading ? 'Loading...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.signInLinkButton}
        onPress={onSignInPress}
      >
        <Text style={styles.signInLinkText}>Already have an account? Sign In</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    fontSize: 18,
    borderRadius: 6,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 15,
    borderRadius: 6,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#10B981',
  },
  signInLinkButton: {
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  signInLinkText: {
    color: '#0284c7',
    textAlign: 'center',
    fontSize: 16,
  },
}); 