import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { AuthError } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import * as QueryParams from 'expo-auth-session/build/QueryParams'
import { Link } from 'expo-router'
import { useRouter } from 'expo-router'

WebBrowser.maybeCompleteAuthSession()

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [facebookLoading, setFacebookLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const { setSession } = useAuth()
  const router = useRouter()

  const handleDeepLink = async (url: string) => {
    try {
      if (url.includes('access_token')) {
        const { params, errorCode } = QueryParams.getQueryParams(url)
        if (errorCode) throw new Error(errorCode)
        const { access_token, refresh_token } = params
        if (access_token && refresh_token) {
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })
          if (error) throw error
          if (session) setSession(session)
        }
      }
    } catch (error: any) {
      console.error('Error handling deep link:', error)
      Alert.alert('Error', error.message || 'Failed to complete authentication')
    }
  }

  useEffect(() => {
    // Handle deep links when the app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    // Handle deep links when the app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const handleSignIn = async () => {
    try {
      setEmailLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Error signing in:', error)

      if (error instanceof AuthError) {
        if (error.message === 'Email not confirmed') {
          Alert.alert(
            'Email Not Confirmed',
            'Please check your inbox to confirm your email address before logging in.',
          )
        } else if (error.message === 'Invalid login credentials') {
          Alert.alert(
            'Login Failed',
            "Invalid email or password. Please check your credentials and try again. If you've forgotten your password, use the 'Forgot Password?' link.",
          )
        } else {
          Alert.alert('Login Failed', error.message)
        }
      } else {
        Alert.alert(
          'An Unexpected Error Occurred',
          'Something went wrong. Please try again.',
        )
      }
    } finally {
      setEmailLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      setGithubLoading(true)
      const redirectTo = makeRedirectUri({
        scheme: 'com.supabase',
        path: 'auth/callback',
      })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error

      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectTo
      )

      if (res.type === 'success') {
        const { url } = res
        const { params, errorCode } = QueryParams.getQueryParams(url)
        if (errorCode) throw new Error(errorCode)
        const { access_token, refresh_token } = params
        if (!access_token) return

        const { error: sessionError, data: { session } } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (sessionError) throw sessionError
        if (session) {
          console.log('User metadata after GitHub sign-in (from AuthScreen):', session.user.user_metadata)
        }
      }
    } catch (error: any) {
      console.error('Error signing in with GitHub:', error)
      Alert.alert('Error', error.message)
    } finally {
      setGithubLoading(false)
      setAppleLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true)
      const redirectTo = makeRedirectUri({
        scheme: 'com.supabase',
        path: 'auth/callback',
      })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error

      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectTo
      )

      if (res.type === 'success') {
        const { url } = res
        const { params, errorCode } = QueryParams.getQueryParams(url)
        if (errorCode) throw new Error(errorCode)
        const { access_token, refresh_token } = params
        if (!access_token) return

        const { error: sessionError, data: { session } } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (sessionError) throw sessionError
        if (session) {
          console.log('User metadata after Google sign-in (from AuthScreen):', session.user.user_metadata)
        }
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      Alert.alert('Error', error.message)
    } finally {
      setGoogleLoading(false)
      setAppleLoading(false)
    }
  }

  const handleFacebookSignIn = async () => {
    try {
      setFacebookLoading(true)
      const redirectTo = makeRedirectUri({
        scheme: 'com.supabase',
        path: 'auth/callback',
      })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'email,public_profile',
        },
      })
      if (error) throw error

      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectTo
      )

      if (res.type === 'success') {
        const { url } = res
        const { params, errorCode } = QueryParams.getQueryParams(url)
        if (errorCode) throw new Error(errorCode)
        const { access_token, refresh_token } = params
        if (!access_token) return

        const { error: sessionError, data: { session } } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (sessionError) throw sessionError
        if (session) {
          console.log('User metadata after Facebook sign-in (from AuthScreen):', session.user.user_metadata)
        }
      }
    } catch (error: any) {
      console.error('Error signing in with Facebook:', error)
      Alert.alert('Error', error.message)
    } finally {
      setFacebookLoading(false)
      setAppleLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true)
      const redirectTo = makeRedirectUri({
        scheme: 'com.supabase',
        path: 'auth/callback',
      })
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'name,email',
        },
      })
      if (error) throw error

      const res = await WebBrowser.openAuthSessionAsync(
        data?.url ?? '',
        redirectTo
      )

      if (res.type === 'success') {
        const { url } = res
        const { params, errorCode } = QueryParams.getQueryParams(url)
        if (errorCode) throw new Error(errorCode)
        const { access_token, refresh_token } = params
        if (!access_token) return

        const { error: sessionError, data: { session } } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })
        if (sessionError) throw sessionError
        if (session) {
          console.log('User metadata after Apple sign-in (from AuthScreen):', session.user.user_metadata)
        }
      }
    } catch (error: any) {
      console.error('Error signing in with Apple:', error)
      Alert.alert('Error', error.message)
    } finally {
      setAppleLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
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
        style={styles.button}
        onPress={handleSignIn}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.buttonText}>
          {emailLoading ? 'Loading...' : 'Sign In'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => router.push('/auth/reset-password')}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.githubButton]}
        onPress={handleGithubSignIn}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.buttonText}>
          {githubLoading ? 'Loading...' : 'Sign in with GitHub'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={handleGoogleSignIn}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.buttonText}>
          {googleLoading ? 'Loading...' : 'Sign in with Google'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.facebookButton]}
        onPress={handleFacebookSignIn}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.buttonText}>
          {facebookLoading ? 'Loading...' : 'Sign in with Facebook'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.appleButton]}
        onPress={handleAppleSignIn}
        disabled={emailLoading || githubLoading || googleLoading || facebookLoading || appleLoading}
      >
        <Text style={styles.buttonText}>
          {appleLoading ? 'Loading...' : 'Sign in with Apple'}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text>Don't have an account? </Text>
        <Link href="/auth/sign-up" asChild>
          <TouchableOpacity>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  )
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
  githubButton: {
    backgroundColor: '#24292e',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  forgotPasswordButton: {
    marginTop: -10,
    marginBottom: 20,
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#0284c7',
    fontSize: 14,
  },
  signUpLinkButton: {
    backgroundColor: 'transparent',
    marginTop: 10,
  },
  signUpLinkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  facebookButton: {
    backgroundColor: '#3b5998',
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  link: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
})