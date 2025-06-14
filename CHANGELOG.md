# Changelog
## 3.4.4 - Enhanced Profile Phase 1: Health Data and Calculations (2025-06-14)
- **Health Calculation Utilities:** Created comprehensive BMI, BMR, and calorie calculation functions
- **Enhanced useUserProfile Hook:** Added health metrics calculation and profile completeness tracking
- **Enhanced Profile Screen:** Added health summary dashboard with BMI, calories, and macro targets
- **Health Data Form Screen:** Created dedicated HealthDataScreen for comprehensive health data input
- **Enhanced Profile Schema:** Added comprehensive health data fields (age, weight, height, gender, activity level)
- **Health Goals:** Added weight goals, calorie targets, and macro targets (protein, carbs, fat)
- **Dietary Preferences:** Added dietary restrictions, allergies, disliked ingredients, and cuisine preferences
- **AI Integration:** Added OpenAI API key storage, model selection, and smart features toggles
- **Updated PRD:** Enhanced user profile requirements with AI-powered features
- **Implementation Plan:** Created comprehensive roadmap for enhanced profile features

## 3.4.3 - Enhanced Shopping List Ingredient Parsing and Delete Recipe (2025-06-14)
- **Enhanced Ingredient Parsing:** Completely rewrote ingredient parsing algorithm to handle complex cases:
  - Supports fractions (1/2, 1/4, 2/3) and mixed numbers (1 1/2)
  - Handles ranges (2-3 cloves) using average values
  - Parses multi-word ingredients correctly ("6 cups vegetable broth")
  - Removes descriptors (chopped, diced, fresh) for cleaner ingredient names
  - Normalizes units to standard forms (tablespoons → tbsp, grams → g)
  - Special handling for "to taste" ingredients
- **Improved Categorization:** Added comprehensive ingredient categorization with:
  - UAE/Middle Eastern ingredients (sumac, za'atar, labneh, halloumi, hammour)
  - New categories: Beverages, Snacks & Sweets, Household items
  - Enhanced produce, dairy, meat, and pantry keyword recognition
  - Updated shopping order for better store navigation
- **Recipe Management:** Implemented delete recipe functionality with confirmation dialog and API cleanup.

## 3.4.2 - Enhanced My Recipes List with Search, Sort, and Improved UI (2025-06-14)
- Added search functionality to filter recipes by name, ingredients, or tags.
- Implemented favorites toggle and filter to show only favorite recipes.
- Added sorting options: Recent, A-Z, Z-A, and Favorites with segmented control UI.
- Enhanced recipe cards to display category, tags, and quick action buttons (edit/delete/favorite).
- Added tag filtering with visual tag chips for easy browsing.
- Improved layout and spacing for better user experience.
- Fixed recipe edit screen to properly load ingredients from both string array and object formats.
- Added intelligent ingredient parsing to extract quantity, unit, and name from ingredient strings.

## 3.4.1 - S3 Recipe Image Upload and Display Fixes (2025-06-14)
- Fixed S3 image upload path to use `public/users/...` for compatibility with Amplify Storage public access.
- Set `contentType: 'image/jpeg'` on image uploads to ensure browser and app rendering.
- Fixed React Native recipe details screen to use the correct S3 public image URL.
- Removed all debug and console log statements from recipe and shopping list screens.
- Added cache-busting and URL correctness checks during troubleshooting.

## 3.4.0 - Enhanced Shopping List Management (Completed)

### Features
- **Shopping List Backend Integration:**
  - Replaced mock data with real Amplify ShoppingListItem model integration
  - Connected "Generate from Meal Plan" to create persistent shopping list items
  - Added "Add to Shopping List" functionality from recipe detail screens
  - Real-time data synchronization across app sessions

- **Enhanced Shopping List UI:**
  - Individual item deletion with X icons next to each item
  - Smart clear options - single button with context-aware choices
  - Consolidated clear functionality (Clear Completed vs Clear All) into one button
  - Added confirmation dialogs for all destructive actions
  - Progress tracking with real item counts

- **Improved User Experience:**
  - Fixed loading state issues - shopping list always shows content
  - Added debug information panel for development troubleshooting
  - Enhanced error handling and user feedback
  - Auto-refresh shopping list data when navigating to screen

### Technical Improvements
- Created comprehensive `useShoppingList` hook for shopping list management
- Added ingredient parsing and categorization from recipes
- Implemented batch operations for meal plan to shopping list generation
- Enhanced error handling with graceful fallbacks
- Removed dependency on mock data for production-ready functionality

### Bug Fixes
- **Fixed Shopping List Loading:** Resolved infinite loading state issues
- **Fixed Add to Shopping List:** Recipe ingredients now properly added to shopping list
- **Fixed Data Persistence:** Shopping list items now persist across app sessions
- **Fixed Navigation:** Shopping list refreshes properly when accessed from other screens

### Files Added/Modified
- `hooks/useShoppingList.ts` - Complete shopping list management
- `app/(tabs)/shopping-list.tsx` - Enhanced UI with backend integration
- `app/recipes/[id].tsx` - Added shopping list integration
- `utils/shoppingListGenerator.ts` - Enhanced ingredient parsing

## 3.3.0 - Profile Management and Shopping List Integration (Completed)

### Features
- **Profile Management System:**
  - Added comprehensive UserProfile model with personal info, settings, and preferences
  - Created useUserProfile hook for profile data management
  - Enhanced ProfileScreen with edit functionality and settings management
  - Profile information: username, display name, bio, profile image support
  - Settings: push notifications, email notifications, privacy controls
  - Preferences: units (metric/imperial), theme (light/dark/system), language

- **Shopping List Enhancements:**
  - Integrated shopping list generation from meal plan data
  - Connected "Generate from Meal Plan" functionality to actual meal plan entries
  - Improved ingredient aggregation and categorization
  - Enhanced type safety and error handling
  - Progress tracking and completion functionality

- **Enhanced Navigation:**
  - Added Profile tab to main navigation with person icon
  - Removed Todo List tab from bottom navigation
  - Fixed recipe detail navigation after route restructuring

### Technical Implementation
- Created `hooks/useUserProfile.ts` for profile data management
- Added UserProfile model to Amplify schema with comprehensive fields
- Enhanced shopping list with real meal plan data integration
- Fixed Amplify schema TypeScript validation errors
- Improved error handling and user feedback throughout

### UI/UX Improvements
- **Profile Screen:** Professional mobile-first design with sections for info, settings, and actions
- **Edit Mode:** In-place editing with save/cancel functionality and form validation
- **Settings Management:** Toggle switches for notifications and privacy preferences
- **User Feedback:** Success/error alerts and loading states for all operations
- **Responsive Design:** Optimized for mobile screens with proper touch targets

### Files Added/Modified
- `hooks/useUserProfile.ts` - Profile data management hook
- `amplify/data/resource.ts` - Added UserProfile model
- `screens/ProfileScreen.tsx` - Complete profile management interface
- `app/(tabs)/shopping-list.tsx` - Enhanced with meal plan integration
- `app/(tabs)/_layout.tsx` - Added profile tab, removed todos tab
- `app/recipes/[id].tsx` - Moved from tabs directory and fixed imports
- `lib/navigation.ts` - Updated recipe navigation paths

### Bug Fixes
- Fixed recipe detail screen navigation after route restructuring
- Resolved TypeScript validation errors in Amplify schema
- Fixed module resolution issues after file moves
- Improved sign-out functionality with better error handling

## 3.2.0 - Meal Planner UI Implementation (Completed)

### Features
- **Meal Planner Tab:**
  - Weekly calendar view with date navigation
  - Daily meal slots for 5 meal types (Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner)
  - Color-coded meal slots for easy visual organization
  - Today/selected date highlighting
  - Daily nutrition summary placeholder
  - Action buttons for shopping list generation and week copying

- **Shopping List Tab:**
  - Categorized shopping list display (Produce, Dairy, Meat & Seafood, Pantry)
  - Progress tracking with completion percentage
  - Check/uncheck items functionality
  - Add custom items capability
  - Clear completed items feature
  - Generate from meal plan and share functionality

- **Enhanced Navigation:**
  - Added meal planner and shopping list tabs to main navigation
  - Proper tab icons using Ionicons
  - Reorganized tab order for better user flow

### UI/UX Improvements
- **Visual Design:** Color-coded meal types for intuitive organization
- **Interactive Elements:** Touch-friendly buttons and navigation
- **Progress Indicators:** Visual feedback for shopping list completion
- **Empty States:** Helpful guidance when no data is present
- **Responsive Layout:** Optimized for mobile screens

### Technical Implementation
- Created reusable date utility functions for calendar navigation
- Implemented mock data structure for development and testing
- Added proper TypeScript typing for all components
- Responsive design with proper styling and spacing

### Files Added
- `app/(tabs)/meal-planner.tsx` - Main meal planning interface
- `app/(tabs)/shopping-list.tsx` - Shopping list management
- `components/RecipePicker.tsx` - Modal for selecting recipes to add to meal plans
- `components/MealPlanDatePicker.tsx` - Modal for adding recipes to meal plan from recipe details
- `hooks/useMealPlanner.ts` - Custom hook for meal planning state management
- Enhanced `app/(tabs)/_layout.tsx` - Updated navigation with new tabs
- Enhanced `app/(tabs)/recipes/[id].tsx` - Added meal plan integration and nutrition display

### Recipe Details Enhancements
- **Add to Meal Plan Integration:** Direct integration from recipe details to meal planner
- **Auto-Navigation:** After adding, user is automatically taken to the meal planner tab and week
- **Nutrition Information Display:** Shows calories, protein, carbs, fat with visual formatting
- **Recipe Metadata:** Displays servings, prep time, cook time, and difficulty level
- **Meal Plan Date Picker:** Intuitive interface for selecting date, meal type, and servings

## 3.1.0 - Subscription Management and Loading Fixes (Completed)

### Features
- **Subscription Management System:**
  - Created centralized subscription manager to prevent MaxSubscriptionsReachedError
  - Added subscription tracking with unique keys and automatic cleanup
  - Implemented subscription limit monitoring (AWS limit: 20 subscriptions)
  - Added debug utilities for monitoring subscription usage and detecting leaks

- **Enhanced Error Handling:**
  - Improved recipe details page with proper auth state checking
  - Added comprehensive error states with user-friendly messages and retry functionality
  - Enhanced Amplify configuration validation and error handling
  - Added loading states with descriptive messages

### Technical Improvements
- Created `lib/subscriptionManager.ts` for centralized subscription tracking
- Added `lib/subscriptionDebug.ts` for development monitoring
- Created `hooks/useAmplifySubscription.ts` for safe subscription patterns
- Enhanced AuthContext with better error handling and initialization states
- Improved component lifecycle management with proper cleanup

### Bug Fixes
- **Fixed MaxSubscriptionsReachedError:** Proper cleanup of GraphQL subscriptions
- **Fixed Recipe Details Auth Error:** Added auth state checking before data loading
- **Fixed Subscription Leaks:** Implemented proper unsubscribe patterns
- **Fixed Race Conditions:** Added mount guards and proper dependency tracking

### Current Issues (Being Debugged)
- App stuck on loading screen - investigating auth initialization
- Temporarily disabled subscription manager to isolate loading issue
- Added debug logging to track auth and navigation state

### Files Modified
- `screens/MyRecipesWithAmplify.tsx` - Enhanced subscription management
- `screens/TodoList.tsx` - Improved subscription cleanup
- `app/(tabs)/recipes/[id].tsx` - Added auth checking and error handling
- `lib/AuthContext.tsx` - Enhanced error handling and debug logging
- `app/_layout.tsx` - Added debug logging and improved loading states

## 3.0.0 - Navigation and Authentication Improvements

### Features
- **Expo Router Integration:**
  - Migrated to file-based routing system using Expo Router
  - Created organized route groups for tabs and auth screens
  - Implemented proper navigation guards for authenticated routes
  - Added type-safe routing with TypeScript support

- **Authentication Improvements:**
  - Enhanced authentication state management
  - Added proper initialization states to prevent race conditions
  - Improved session handling with better error states
  - Added loading states during authentication checks
  - Implemented proper cleanup for subscriptions and mounted states

- **UI/UX Improvements:**
  - Added loading indicators during state transitions
  - Improved error handling and user feedback
  - Better handling of safe areas using react-native-safe-area-context
  - Smoother navigation transitions between auth and main screens

### Technical Improvements
- Proper TypeScript types for navigation and auth states
- Better state management in AuthContext
- Improved component lifecycle management
- Enhanced error handling throughout the app
- Better code organization with file-based routing

### Bug Fixes
- Fixed authentication initialization issues
- Resolved race conditions in recipe loading
- Fixed safe area handling in navigation
- Prevented memory leaks from unmanaged subscriptions

## 2.0.0 - Amplify Integration and Recipe Management

This release adds AWS Amplify integration and recipe management features.

### Features
- **AWS Amplify Integration:**
  - Set up AWS Amplify backend with Data API
  - Configured Amplify authentication to work alongside Supabase
  - Created Recipe and Todo schemas in Amplify
  - Added TypeScript support for Amplify models
- **Recipe Management:**
  - Added Recipe data model with support for name, ingredients, instructions, and images
  - Created MyRecipesWithAmplify component for displaying user-specific recipes
  - Implemented real-time recipe updates using Amplify DataStore subscriptions
  - Added user-specific recipe filtering and data ownership
  - Created data migration script for seeding initial recipe data
- **Code Organization:**
  - Separated Amplify configuration into dedicated files
  - Added TypeScript types for all Amplify models
  - Implemented proper error handling for recipe operations
  - Added loading states and error states for recipe views

### Technical Improvements
- Added proper TypeScript support throughout the application
- Implemented data seeding mechanism for first-time users
- Added JSON string conversion for complex data types (ingredients, instructions)
- Improved error handling and loading states

## 1.0.0 - Initial Release

This release introduces the core authentication features for the React Native application using Supabase.

### Features
- **Supported Sign-in Methods:**
  - Email and Password
  - GitHub OAuth
  - Google OAuth
  - Facebook OAuth
- **Supabase Integration:** Set up the Supabase client with AsyncStorage and SecureStore for persistent and encrypted sessions.
- **Email/Password Authentication:** Implemented user sign-in and sign-up with email and password.
- **OAuth Social Login:** Added GitHub and Google OAuth authentication, including deep linking for callback handling.
- **Deep Linking:** Configured custom URL scheme (com.supabase://auth/callback) for handling authentication redirects across iOS and Android.
- **Authentication Screens:** Created dedicated screens for:
  - `AuthScreen.tsx`: For user sign-in with email/password and social logins.
  - `SignUpScreen.tsx`: For new user registration.
  - `ConfirmationScreen.tsx`: To display a success message after email confirmation via deep link.
- **Profile Screen:** Implemented `ProfileScreen.tsx` to display authenticated user's email and `full_name` from Google OAuth metadata, attempting to split into first/last names.
- **Forgot Password:** Added functionality to send password reset emails via a 'Forgot Password?' link.
- **Individual Loading States:** Implemented separate loading states for each authentication button to improve UI responsiveness.

### Fixes
- **Deep Linking URL Correction:** Fixed a typo in the deep linking URL (from `om.supabase` to `com.supabase`) to ensure proper redirection.
- **User Metadata Display:** Adjusted `ProfileScreen.tsx` to correctly display `full_name` from Google OAuth data, as `first_name` and `last_name` were not directly provided.
- **AuthContext `setSession` Exposure:** Ensured `setSession` function is properly exposed and utilized by the `AuthContext` to manage user sessions.
- **Error Handling:** Improved user-facing error messages for login failures.