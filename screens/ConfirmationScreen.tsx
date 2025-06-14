import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ConfirmationScreenProps {
  onSignInPress: () => void;
}

export default function ConfirmationScreen({ onSignInPress }: ConfirmationScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Confirmed!</Text>
      <Text style={styles.message}>Your email has been successfully confirmed. You can now sign in.</Text>
      <TouchableOpacity style={styles.button} onPress={onSignInPress}>
        <Text style={styles.buttonText}>Go to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#555',
  },
  button: {
    backgroundColor: '#0284c7',
    padding: 15,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 