# Apple Sign-In Setup Guide

This document outlines the step-by-step process to implement and configure "Sign In with Apple" in your React Native (Expo) application using Supabase, including common debugging steps.

## 1. Code Changes in `screens/AuthScreen.tsx`

We updated `AuthScreen.tsx` to include the Apple sign-in button and its logic, similar to other OAuth providers.

### `screens/AuthScreen.tsx` Updates:

*   Added a new state variable for Apple loading:
    ```typescript
    const [appleLoading, setAppleLoading] = useState(false);
    ```
*   Created `handleAppleSignIn` function:
    ```typescript
    const handleAppleSignIn = async () => {
      try {
        setAppleLoading(true);
        const redirectTo = makeRedirectUri({
          scheme: 'com.supabase',
          path: 'auth/callback',
        });
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            scopes: 'name,email', // Requesting name and email scopes
          },
        });
        if (error) throw error;

        const res = await WebBrowser.openAuthSessionAsync(
          data?.url ?? '',
          redirectTo
        );

        if (res.type === 'success') {
          const { url } = res;
          const { params, errorCode } = QueryParams.getQueryParams(url);
          if (errorCode) throw new Error(errorCode);
          const { access_token, refresh_token } = params;
          if (!access_token) return;

          const { error: sessionError, data: { session } } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (sessionError) throw sessionError;
          if (session) {
            console.log('User metadata after Apple sign-in (from AuthScreen):', session.user.user_metadata);
          }
        }
      } catch (error: any) {
        console.error('Error signing in with Apple:', error);
        Alert.alert('Error', error.message);
      } finally {
        setAppleLoading(false);
      }
    };
    ```
*   Added a new button in the `return` statement for Apple sign-in:
    ```tsx
    <TouchableOpacity
      style={[styles.button, styles.appleButton]}
      onPress={handleAppleSignIn}
      disabled={emailLoading || githubLoading || googleLoading || facebookLoading || forgotPasswordLoading || appleLoading}
    >
      <Text style={styles.buttonText}>
        {appleLoading ? 'Loading...' : 'Sign in with Apple'}
      </Text>
    </TouchableOpacity>
    ```
*   Updated the `disabled` prop on all other buttons to include `appleLoading`.
*   Added `appleButton` style to `StyleSheet.create`:
    ```typescript
    appleButton: {
      backgroundColor: '#000000',
    },
    ```

## 2. Apple Developer Portal Configuration

This is the most critical part, requiring precise steps.

### 2.1. Update `app.json` Bundle Identifier

Due to `com.supabase` being unavailable/reserved, we updated the `bundleIdentifier` to a unique one:

*   **Original (likely):** `"bundleIdentifier": "com.supabase"`
*   **New (example):** `"bundleIdentifier": "auth.adel.com.supabase"`

After changing, run `npx expo prebuild --clean` to apply the changes to native project files.

### 2.2. Register App ID (if not already done with your new bundle ID)

*   Go to [Apple Developer Portal](https://developer.apple.com/account/) > **Certificates, Identifiers & Profiles** > **Identifiers**.
*   Click `+` to register a new Identifier, select **App IDs**.
*   Choose **App** type.
*   **Description**: A descriptive name for your app.
*   **Bundle ID**: Select **Explicit** and enter your unique bundle identifier (e.g., `auth.adel.com.supabase`).
*   **Capabilities**: Check **"Sign In with Apple"** and **"Associated Domains"**.
*   Register the App ID and **Save**.

### 2.3. Create and Configure a Services ID (Crucial for Supabase Integration)

This acts as the client ID for third-party services like Supabase.

*   Go to [Apple Developer Portal](https://developer.apple.com/account/) > **Certificates, Identifiers & Profiles** > **Identifiers**.
*   Click `+` to register a new Identifier, select **Services IDs**.
*   **Description**: A name indicating its purpose (e.g., `Supabase Apple Auth for My App`).
*   **Identifier**: Create a unique reverse domain-style string (e.g., `com.adel.supaouth.supabase.service`). **This is your Apple Client ID for Supabase.**
*   Register the Services ID.
*   Find your newly created Services ID in the list and click on it.
*   Check the box for **"Sign In with Apple"**.
*   Click the **"Configure"** button next to it.
    *   **Primary App ID**: Select your application's App ID (`auth.adel.com.supabase`) from the dropdown.
    *   **Domains and Subdomains**: Leave this blank for mobile deep linking.
    *   **Return URLs**: **Crucially, enter ONLY your Supabase callback URL here.** Do NOT include your custom scheme deep link here. One URL per line:
        *   `https://fygrhhsgmymkriudjtul.supabase.co/auth/v1/callback`
    *   Click **"Save"** in the pop-up, then **"Save"** again on the main Services ID details page.

### 2.4. Generate a Private Key

This key is used by Supabase to authenticate with Apple's servers.

*   Go to [Apple Developer Portal](https://developer.apple.com/account/) > **Certificates, Identifiers & Profiles** > **Keys**.
*   Click `+` to register a new key.
*   **Key Name**: Give it a descriptive name (e.g., `Supa-Outh Apple Sign In Key`).
*   Check **"Sign In with Apple"** and click **"Configure"**.
*   Select your **Primary App ID**: `auth.adel.com.supabase`.
*   Click "Save", then "Continue", and **"Download"** the private key (`.p8` file). **Store this file securely; it's a one-time download!**
*   **Make note of the "Key ID"** (a 10-character string displayed on this page). You'll need this for Supabase.

## 3. Supabase Dashboard Configuration

*   Go to your Supabase project dashboard.
*   Navigate to **Authentication** > **Providers** > **Apple**.
*   Enter the following values:
    *   **Apple Team ID**: Your Apple Developer Team ID (e.g., `B4K875YZF6`). Find this under **Membership** in your Apple Developer account.
    *   **Apple Client ID**: The **Identifier** of the **Services ID** you created (e.g., `com.adel.supaouth.supabase.service`).
    *   **Apple Key ID**: The 10-character Key ID from the private key you downloaded.
    *   **Apple Private Key**: The **entire content** of the `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines). Copy and paste it here.
*   **Save** the changes in Supabase.

## 4. Install `jsonwebtoken`

If you encounter `Error: Cannot find module 'jsonwebtoken'`, install it:

```bash
npm install jsonwebtoken
```

## 5. Rebuild and Test Your App

After all configurations, it's essential to rebuild your native app to ensure changes are picked up:

```bash
npx expo run:ios
```

This command will build and run your iOS app on a simulator or connected device, allowing you to test "Sign In with Apple." 