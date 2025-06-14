# OAuth Authentication Setup Guide for React Native with Supabase

This guide provides detailed, step-by-step instructions for configuring various OAuth providers (Google, Facebook, Apple, GitHub) in their respective developer consoles and integrating them with your Supabase project for a React Native application.

## Table of Contents

1.  [General Prerequisites](#1-general-prerequisites)
2.  [GitHub OAuth Setup](#2-github-oauth-setup)
3.  [Google OAuth Setup](#3-google-oauth-setup)
4.  [Facebook OAuth Setup](#4-facebook-oauth-setup)
5.  [Apple Sign-In Setup](#5-apple-sign-in-setup)
6.  [Rebuild and Test Your App](#6-rebuild-and-test-your-app)

---

## 1. General Prerequisites

Before you begin, ensure you have:

*   A Supabase project. Note your **Supabase Project URL** (e.g., `https://abcdefg.supabase.co`) and **Anon Key**.
    *   Your **Supabase Project Reference** is the unique string in your URL (e.g., `abcdefg`).
*   Your React Native (Expo) application set up with the `supabase-js` client and `expo-auth-session`.
*   Your `app.json` configured with a custom URL scheme (e.g., `"scheme": "com.supabase"`).
*   Your `AuthScreen.tsx` (or equivalent) configured to use `makeRedirectUri` with your scheme and `supabase.auth.signInWithOAuth` for each provider.

### Universal Redirect URLs for Supabase

Across all providers, you will generally need to add the following redirect URLs to their respective configurations:

1.  **Supabase Auth Callback URL (HTTPS):**
    `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
    *(Replace `YOUR_SUPABASE_PROJECT_REF` with your actual project reference)*

2.  **Custom Deep Link Scheme URL:**
    `com.supabase://auth/callback`

---

## 2. GitHub OAuth Setup

### 2.1. GitHub Developer Settings

1.  Go to [GitHub](https://github.com/) and log in.
2.  Navigate to **Settings** (your profile dropdown) > **Developer settings** > **OAuth Apps**.
3.  Click **"New OAuth App"**.
4.  Fill in the details:
    *   **Application name**: A recognizable name for your app.
    *   **Homepage URL**: Your app's website or placeholder (e.g., `https://localhost`).
    *   **Authorization callback URL**: `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
        *(Replace `YOUR_SUPABASE_PROJECT_REF`)*
5.  Click **"Register application"**.
6.  On the next page, note down your **Client ID** and **Generate a new client secret**. Copy the secret immediately, as it's only shown once.

### 2.2. Supabase Dashboard Configuration

1.  Go to your [Supabase Dashboard](https://app.supabase.com/) > your project > **Authentication** > **Providers**.
2.  Find **GitHub** in the list and enable it.
3.  Paste your GitHub OAuth App's **Client ID** and **Client Secret** into the respective fields.
4.  **Save** the settings.

---

## 3. Google OAuth Setup

### 3.1. Google Cloud Console

1.  Go to [Google Cloud Console](https://console.cloud.google.com/) and log in.
2.  Select an existing project or create a new one.
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
    *   Configure the consent screen details (App name, support email, developer contact information). Choose "External" for User Type if not publishing to Google Workspace.
    *   Add `email` and `profile` as **scopes**.
4.  Navigate to **APIs & Services** > **Credentials**.
5.  Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**.
6.  For **Application type**, select **"Web application"**.
    *   **Name**: A descriptive name (e.g., `Supabase Auth Web Client`).
    *   **Authorized JavaScript origins**: Add `https://YOUR_SUPABASE_PROJECT_REF.supabase.co`
        *(Replace `YOUR_SUPABASE_PROJECT_REF`)*
    *   **Authorized redirect URIs**: Add `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
        *(Replace `YOUR_SUPABASE_PROJECT_REF`)*
7.  Click **"Create"**.
8.  A pop-up will show your **Client ID** and **Client Secret**. Note these down.

### 3.2. Supabase Dashboard Configuration

1.  Go to your [Supabase Dashboard](https://app.supabase.com/) > your project > **Authentication** > **Providers**.
2.  Find **Google** in the list and enable it.
3.  Paste your Google OAuth Client's **Client ID** and **Client Secret** into the respective fields.
4.  **Save** the settings.

---

## 4. Facebook OAuth Setup

### 4.1. Facebook Developer Account

1.  Go to [Facebook Developers](https://developers.facebook.com/) and log in/get started.
2.  Go to **My Apps** > **"Create App"**.
3.  Select **"Consumer"** as the app type and fill in app name/contact email.
4.  In your new app dashboard, go to **Settings** > **Basic**.
    *   Note your **App ID** and **App Secret**.
    *   Add a **Platform** (e.g., "Website" or "iOS" for initial setup, though the flow goes through the web redirect).
    *   Ensure your **Privacy Policy URL** is set.
5.  Go to **Add Product** and set up **Facebook Login**.
6.  Navigate to **Facebook Login** > **Settings**.
    *   Under **"Valid OAuth Redirect URIs"**, add both of these:
        1.  `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
            *(Replace `YOUR_SUPABASE_PROJECT_REF`)*
        2.  `com.supabase://auth/callback` *(This is your custom deep link scheme)*
    *   Click **"Save Changes"**.
7.  Go to **App Review** > **Permissions and Features**.
    *   Ensure `email` and `public_profile` have **Standard Access** (sufficient for development).
    *   For production, you might need to submit for **Advanced Access**.
8.  Make sure your app is in **"In Development"** mode (toggle at the top) for testing, or **"Live"** for production.

### 4.2. Supabase Dashboard Configuration

1.  Go to your [Supabase Dashboard](https://app.supabase.com/) > your project > **Authentication** > **Providers**.
2.  Find **Facebook** in the list and enable it.
3.  Paste your Facebook App's **App ID** and **App Secret** into the respective fields.
4.  **Save** the settings.

---

## 5. Apple Sign-In Setup

Implementing "Sign In with Apple" requires careful configuration in the Apple Developer Portal due to its unique requirements, especially for native mobile applications using a third-party service like Supabase.

### 5.1. Update `app.json` Bundle Identifier (if not already done)

Ensure your `app.json` has a unique `bundleIdentifier` for iOS and `package` for Android, as generic ones like `com.supabase` may be unavailable/reserved.

*   **Example (iOS):** `"bundleIdentifier": "com.yourcompany.yourappname"`
*   **Example (Android)::** `"package": "com.yourcompany.yourappname"`

After updating, run `npx expo prebuild --clean` to apply changes to native project files.

### 5.2. Apple Developer Portal Configuration

1.  **Enroll in Apple Developer Program** (if not already).
2.  **Enable "Sign In with Apple" Capability for Your App ID:**
    *   Go to [Apple Developer Portal](https://developer.apple.com/account/) > **Certificates, Identifiers & Profiles** > **Identifiers**.
    *   Find your **App ID** (e.g., `com.yourcompany.yourappname`).
    *   Click on it, check **"Sign In with Apple"** (and optionally **"Associated Domains"**) under Capabilities.
    *   Click **"Save"**.

3.  **Create and Configure a Services ID (Crucial for Supabase Client ID):**
    *   Still in **Identifiers**, click `+` to register a new Identifier.
    *   Select **"Services IDs"** and click "Continue".
    *   **Description**: A clear name (e.g., `Supabase Apple Auth for My App`).
    *   **Identifier**: Create a unique reverse domain-style string (e.g., `com.yourcompany.yourappname.supabase.service`). **This is your Apple Client ID for Supabase.**
    *   Register the Services ID.
    *   Find your newly created Services ID in the list and click on it.
    *   Check the box for **"Sign In with Apple"**.
    *   Click the **"Configure"** button next to it.
        *   **Primary App ID**: Select your application's App ID (e.g., `com.yourcompany.yourappname`) from the dropdown.
        *   **Domains and Subdomains**: Leave this blank.
        *   **Return URLs**: **Crucially, enter ONLY your Supabase HTTPS callback URL here.** Do NOT include your custom scheme deep link.
            *   `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`
        *   Click **"Save"** in the pop-up, then **"Save"** again on the main Services ID details page.

4.  **Generate a Private Key:**
    *   Go to **Certificates, Identifiers & Profiles** > **Keys**.
    *   Click `+` to register a new key.
    *   **Key Name**: Give it a descriptive name (e.g., `My App Apple Sign In Key`).
    *   Check **"Sign In with Apple"** and click **"Configure"**.
    *   Select your **Primary App ID**: `com.yourcompany.yourappname`.
    *   Click "Save", then "Continue", and **"Download"** the private key (`.p8` file). **Store this file securely; it's a one-time download!**
    *   **Make note of the "Key ID"** (a 10-character string displayed on this page).

### 5.3. Supabase Dashboard Configuration

1.  Go to your [Supabase Dashboard](https://app.supabase.com/) > your project > **Authentication** > **Providers**.
2.  Find **Apple** in the list and enable it.
3.  Enter the following values:
    *   **Apple Team ID**: Your Apple Developer Team ID (10-character alphanumeric string). Find this under **Membership** in your Apple Developer account.
    *   **Apple Client ID**: The **Identifier** of the **Services ID** you created (e.g., `com.yourcompany.yourappname.supabase.service`).
    *   **Apple Key ID**: The 10-character Key ID from the private key you downloaded.
    *   **Apple Private Key**: The **entire content** of the `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines). Copy and paste it here.
4.  **Save** the changes.

### 5.4. Install `jsonwebtoken` (if needed)

If you encounter `Error: Cannot find module 'jsonwebtoken'`, install it:

```bash
npm install jsonwebtoken
```

---

## 6. Rebuild and Test Your App

After all configurations in developer consoles and Supabase, it's essential to rebuild your native app to ensure all changes are picked up:

```bash
npx expo prebuild --clean
npx expo run:ios # or npx expo run:android
```

This command will build and run your app, allowing you to test the integrated OAuth sign-in methods. 