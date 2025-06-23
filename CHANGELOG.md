# Culina App Changelog

## [2025-06-22] Infrastructure & Tooling Updates

### 🔧 **Build & Configuration**
- **Added EAS Build Configuration**: Introduced `eas.json` to configure builds and updates with Expo Application Services.
- **iOS URL Scheme for Supabase**: Updated `Info.plist` to include the necessary URL schemes for Supabase OAuth redirects on iOS.
- **Hardcoded API Key Auth**: The Amplify client in `lib/amplify.ts` is now explicitly configured to use `apiKey` authentication mode, aligning with the backend setup.

### 🌱 **Developer Tooling**
- **Added Database Seeding Scripts**: Included new scripts in the `scripts/` directory to allow for database seeding (content for this is pending).

## [2025-06-22] Supabase Auth Integration & Profile Screen Fixes

### 🚀 **Major Feature: Supabase Authentication**
- **Replaced Amplify Auth**: Completely removed the default AWS Amplify authentication in favor of Supabase.
- **Supabase Integration**: The app now uses Supabase for all authentication flows, including sign-in, sign-out, and session management.
- **Updated Data Models**: All data models now include a `userId` field to link data to Supabase users.
- **API Key Authorization**: The default authorization mode for the Amplify backend is now set to `apiKey`.

### 🐛 **Bug Fixes & Improvements**
- **Profile Screen Fixed**: Resolved an issue where the profile screen would appear empty after logging in.
- **Loading Indicator**: Added a loading indicator to the app's entry point to prevent screens from rendering before authentication is complete.
- **Profile Creation**: Fixed a bug where new user profiles were not being populated with their name and other details from their social profiles.
- **Linter Errors Resolved**: Fixed numerous linter errors related to type mismatches between the new Supabase session object and the existing Amplify data models.

## [2025-06-21] Technical Post-Mortem & Infrastructure Recovery

### 🚨 **Critical Issue: Amplify CLI State Corruption**
- **Problem**: A series of backend configuration changes led to a fatal corruption of the local Amplify project state. The `ampx sandbox` command became trapped in a circular dependency, failing with `ENOENT: no such file or directory, open '.../.amplify/artifacts/cdk.out/manifest.json'` because the directory it was supposed to create did not exist.
- **Root Cause**: The new `ampx` (Amplify Gen 2) CLI is highly sensitive to the state of the `.amplify/artifacts` directory. Manually deleting or incorrectly modifying this directory, combined with failed Git checkouts of the `amplify/` source directory, resulted in an irrecoverable state where the CLI could neither fix itself nor be fixed by manual file creation.

### ✅ **Resolution: Full State Restoration from Backup**
- **Failed Attempts**:
  - Manually creating a placeholder `manifest.json` file.
  - Deleting and recreating the `cdk.out` directory.
  - Restoring only the `amplify/` source directory from Git.
- **The Solution**: The project was recovered by performing a full restoration of the local state from a zip backup (`culina-supa-backup-2025-06-18.zip`).
- **Key Learning**: To recover from a corrupted Amplify Gen 2 environment, **both the source code (`amplify/`) and the local build artifacts (`.amplify/`) must be restored to a known-good, consistent state.** Restoring only one without the other will perpetuate the build failure loop. The zip backup provided this consistent state.

## [2025-06-20] AI-Generated Recipes as Permanent App Content

### 🚀 **Major Feature: Permanent AI Recipes**
- **Save AI Meal Plans**: AI-generated meal plan suggestions can now be saved as permanent recipes in the user's collection.
- **"AI Generated" Source**: New recipes created from AI suggestions are automatically marked with `source: "AI Generated"`.
- **Dedicated AI Tag**: An "AI Generated" tag is automatically added to these recipes for easy filtering and identification.
- **Visual Indicator**: A ✨ "sparkles" icon now appears next to AI-generated recipes in both recipe lists and on the recipe details screen.
- **Default Recipe Image**: AI-generated recipes are now assigned a default placeholder image to ensure a consistent UI.

### 🐛 **Bug Fixes & Improvements**
- **AI Meal Plan Keys**: Resolved a recurring React warning about missing `key` props when accepting an AI-generated meal plan.

## [2025-06-19] Critical Bug Squashing & Stability Improvements

### 🐛 **Major Bug Fixes**
- **Shopping List Infinite Loop**: Fixed a critical bug causing the shopping list to get stuck in an infinite loading loop.
- **Recipe Details Loading**: Resolved an issue where the recipe details screen would fail to load recipe data.
- **Profile Data Persistence**: Fixed a bug where user profile data was not being saved or retrieved correctly.
- **Add Recipe Screen Crash**: Fixed a crash on the "Add Recipe" screen caused by improper text rendering.
- **Meal Planner Rendering**: Resolved a React warning about missing `key` props when rendering AI-generated meal plans.
- **API Key Pasting**: Fixed an issue that prevented users from pasting their Gemini API key in the profile settings.

### 🔧 **Technical Improvements**
- **Mock Backend Enhancements**: Significantly improved the mock Amplify client to properly handle data for `UserProfile` and `Recipe` models, including `get` and `list` operations with filtering.
- **State Management**: Refactored the `useShoppingList` hook to use `useMemo` for the `weekStartDate`, preventing unnecessary re-renders.
- **Component Stability**: Added missing `key` props to dynamically rendered lists in the meal planner, ensuring stable and predictable rendering.

### 🧹 **UI Clean-up**
- **Removed "Test Connection" Button**: Removed a now-redundant "Test Amplify Connection" button from the recipe list screen.

## [2025-06-18] Recipe Import Bug Fixes & AI Service Improvements

### 🐛 **Critical Bug Fixes**
- **Fixed AI Recipe Import**: Resolved issue where recipe import from URL using AI was failing due to incorrect API key access pattern
- **Corrected API Key Path**: Fixed [`useAIServices`](hooks/useAIServices.ts) hook to access `profile.geminiApiKey` directly instead of `profile.settings.geminiApiKey`
- **Updated Gemini API Endpoint**: Upgraded from deprecated `gemini-pro` to newer `gemini-2.0-flash-exp` model for better performance
- **Enhanced Error Handling**: Added proper null safety checks to prevent TypeScript errors when AI model is unavailable

### 🔧 **Technical Improvements**
- **API Key Consistency**: Aligned API key access pattern across all components to use `profile.geminiApiKey` consistently
- **Better Error Messages**: Enhanced error handling for AI service unavailability with user-friendly messages
- **Type Safety**: Added null checks to prevent runtime errors when AI services are not initialized

### 🚀 **Recipe Import Features**
- **URL Import**: AI-powered recipe extraction from any recipe website URL
- **Text Import**: Manual recipe text parsing with intelligent ingredient and instruction detection
- **Smart Extraction**: Advanced AI prompting for accurate recipe data extraction from web content
- **Dual Import Modes**: Tab-based interface for both URL and text-based recipe imports

### 📱 **User Experience**
- **Loading States**: Clear visual feedback during recipe import process
- **Error Recovery**: Helpful error messages with suggestions for alternative import methods
- **Smart Fallbacks**: Automatic fallback to text import when URL extraction fails

## [2024-06-23] AI Settings Save Fix & Restore Point

### 🐛 **Bug Fixes & Improvements**
- **AI Settings Save Fixed**: Resolved an issue where saving AI settings (including Gemini API key, model, and smart feature toggles) in the profile screen did not persist changes.
- **Schema Update**: Added `smartMealPlanningEnabled` to the `UserProfile` model in the Amplify schema to ensure all AI settings can be saved and restored.
- **Amplify Gen 2**: Confirmed schema and type updates are handled automatically in sandbox mode.

### 🛡️ **Restore Point**
- **Version Tag**: Created a new version and Git tag for this stable state, recommended as a restore point if future issues arise.

## Version 2.0.0 - Modern UI Redesign (December 16, 2025)

### 🎨 **Major UI/UX Improvements**

#### **Home Screen Redesign**
- ✨ **Dynamic Personalized Greeting**: Time-based greetings with user's name
  - "Good Morning, [Name]" (12am-12pm) ☀️
  - "Good Afternoon, [Name]" (12pm-6pm) 🌤️  
  - "Good Evening, [Name]" (6pm-12am) 🌙
- 🎯 **Compact Hero Section**: Reduced height by 60% for better content visibility
- 📱 **Mobile-Optimized Layout**: Fixed element cutoff issues on smaller screens
- 💫 **Feature Badges**: AI-Powered, Personalized, Quick & Easy highlights

#### **Recipe Cards Complete Redesign**
- 🖼️ **Image-Free Design**: Removed images for faster loading and cleaner look
- 📏 **Fixed Height Cards**: Consistent 260px height for perfect alignment
- 📱 **Horizontal Scrolling**: Smooth card browsing with snap-to behavior
- 🎨 **Modern Card Layout**:
  - Cuisine badge with blue styling
  - Compact recipe summary (name, description, metrics)
  - Prominent action buttons at bottom
- 📊 **Enhanced Metrics**: Color-coded icons for calories, time, and difficulty
- 🔤 **Improved Typography**: Better font sizes and spacing hierarchy

#### **AI Recipe Recommendations**
- ✏️ **Edit Prompt Feature**: "Customize" button to modify AI instructions
- 💾 **Persistent Custom Prompts**: Saved to user profile across sessions
- 🔄 **Better Error Handling**: Enhanced JSON parsing with multiple fallbacks
- 🚀 **Infinite Loop Fix**: Resolved useEffect and re-rendering issues
- 📝 **Summary Cards**: Show key info only, full details in modal

### 🏗️ **Technical Improvements**

#### **Design System**
- 🎨 **Centralized Design Tokens**: Created comprehensive design system
- 🌈 **Consistent Color Palette**: Professional blue/green color scheme
- 📐 **Typography Scale**: Standardized font sizes and weights
- 🪟 **Shadow System**: Multiple elevation levels for depth
- 📱 **Component Styles**: Reusable button, card, and input styles

#### **Performance Enhancements**
- ⚡ **Faster Loading**: Removed image dependencies from recipe cards
- 🔧 **Optimized Hooks**: Fixed infinite useEffect loops
- 💾 **Better State Management**: Improved React component lifecycle
- 📱 **Mobile Performance**: Reduced memory usage and improved scrolling

#### **User Experience**
- 🎯 **Progressive Disclosure**: Summary cards → detailed modal
- 👆 **Touch-Friendly**: Properly sized buttons and interactive elements
- 📱 **Responsive Design**: Works across all screen sizes
- 🔄 **Smooth Interactions**: Enhanced scrolling and transitions

### 🛠️ **Bug Fixes**
- ✅ Fixed recipe card button visibility issues
- ✅ Resolved home header content cutoff
- ✅ Fixed infinite API call loops
- ✅ Improved JSON parsing reliability
- ✅ Enhanced error handling for AI responses

### 📱 **Mobile-First Improvements**
- 🎯 **Compact Layout**: Optimized for small screens
- 👆 **Better Touch Targets**: Accessibility-compliant button sizes
- 📱 **Responsive Text**: Readable on all device sizes
- 🔄 **Smooth Scrolling**: Enhanced horizontal card browsing

## [2025-06-16] Achievement System & Home Screen Dashboard

### 🏆 **Complete Achievement System Implementation**
- **Achievement Framework**: Comprehensive gamification system with 15+ achievements across 5 categories
- **Real-time Tracking**: Automatic tracking of user actions (recipes created, meals planned, AI usage)
- **Achievement Badges**: Beautiful visual badges with rarity levels (common, rare, epic, legendary)
- **Animated Notifications**: Slide-in notifications when achievements are unlocked with confetti-style celebrations
- **Progress Tracking**: Shows progress toward next achievement with visual progress bars
- **Points System**: Achievement points system with total score tracking

### 🎯 **Achievement Categories & Examples**
- **Cooking**: "Chef in the Making" (first recipe), "Recipe Master" (10 recipes), "Culinary Expert" (25 recipes)
- **Planning**: "Planning Ahead" (first meal), "Weekly Warrior" (7-day streak), "Planning Legend" (30-day streak)
- **AI Integration**: "AI Pioneer" (first AI recipe), "AI Enthusiast" (5 AI suggestions), "AI Master" (20 AI uses)
- **Health**: "Healthy Week" (7 days nutrition goals), "Balanced Eater" (macro targets hit)
- **Social**: "Recipe Sharer" (first shared recipe), "Week Planner" (complete week planned)

### 🔧 **Technical Achievement Features**
- **[`utils/achievementSystem.ts`](utils/achievementSystem.ts)**: Core achievement logic, validation, and progress calculation
- **[`hooks/useAchievements.ts`](hooks/useAchievements.ts)**: React hook for achievement state management and persistence
- **[`components/dashboard/AchievementBadges.tsx`](components/dashboard/AchievementBadges.tsx)**: UI components with badges, notifications, and modal
- **Local Storage**: AsyncStorage persistence for achievements and user statistics
- **Smart Notifications**: Non-intrusive achievement unlock celebrations

### 🎨 **Visual Achievement System**
- **Badge Design**: Color-coded badges with icons and rarity indicators
- **Progress Visualization**: Circular progress indicators and progress bars
- **Animated Celebrations**: Smooth slide-in notifications with auto-dismiss
- **Achievement Gallery**: Full modal view of all achievements with progress tracking
- **Recent Unlocks**: Quick access to recently earned achievements

### 🧠 **Smart Daily Suggestions System**
- **Contextual Intelligence**: Time-aware suggestions that adapt throughout the day
- **Weather Integration**: Mock weather-based recipe recommendations (soups for cold, salads for hot)
- **Meal Planning Prompts**: Smart reminders for breakfast (6-10am), lunch (11-2pm), dinner (4-7pm)
- **Recipe of the Day**: Random selection from user's saved recipes for inspiration
- **Quick Meal Solutions**: "15-min dinners" suggestions for busy evening hours
- **Day-Specific Tips**: Sunday meal prep, Monday motivation, weekend cooking ideas
- **Multi-Type Suggestions**: Recipe recommendations, actionable prompts, cooking tips, and seasonal advice

### 🕒 **Recently Viewed Recipes**
- **Smart History Tracking**: Automatically tracks recipe views with timestamps
- **Quick Access**: Horizontal scroll of recently viewed recipes with images and details
- **Cook Again Feature**: One-tap meal planning integration with intelligent meal type detection
- **Visual Recipe Cards**: Rich cards with images, categories, calories, cook time, and difficulty
- **Persistent Storage**: AsyncStorage-based history that survives app restarts
- **Smart Cleanup**: Automatic deduplication and intelligent ordering by recency

### 🎯 **Enhanced Dashboard Intelligence**
- **[`components/dashboard/SmartSuggestions.tsx`](components/dashboard/SmartSuggestions.tsx)**: AI-powered contextual recommendations engine
- **[`