# Culina App Changelog

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
- **[`components/dashboard/RecentlyViewed.tsx`](components/dashboard/RecentlyViewed.tsx)**: Recipe history tracking and quick access component
- **Refresh Mechanisms**: Auto-refresh suggestions every 30 minutes + manual refresh buttons
- **Priority-Based Sorting**: Intelligent suggestion ranking based on context and user needs
- **Cross-Component Integration**: Seamless navigation between dashboard sections and app features

### ⚡ **Quick Wins Implementation - Professional Polish**
- **Real Profile Integration**: Connected user nutrition goals to dashboard stats display
- **Professional Loading States**: Animated skeleton screens for all dashboard components
- **Comprehensive Error Handling**: User-friendly error messages with retry functionality
- **Recipe View Tracking**: Automatic recently viewed recipes tracking integration
- **Visual Feedback**: Loading indicators, error states, and empty states throughout app

### 🎨 **Enhanced User Experience Components**
- **[`components/shared/LoadingStates.tsx`](components/shared/LoadingStates.tsx)**: Animated skeleton screens for all dashboard sections
- **[`components/shared/ErrorStates.tsx`](components/shared/ErrorStates.tsx)**: Comprehensive error handling with Toast notifications and retry options
- **Smart Fallbacks**: Graceful degradation when data is unavailable or loading
- **Consistent Design**: All components follow centralized design system patterns

### 🤖 **AI Recipe Enhancement - Restaurant-Quality Generation**
- **Enhanced Recipe Structure**: Detailed ingredients with precise quantities, units, and preparation notes
- **Professional Instructions**: Step-by-step cooking with timing, temperatures, and pro tips
- **Accurate Nutrition**: Real calorie, protein, carb, and fat calculations per serving
- **Multiple Recipe Types**: General, quick meals, seasonal, cuisine-specific, health-focused options
- **Recipe Validation**: Ensures completeness and practicality for home cooking

### 🎯 **Advanced AI Features Implementation**
- **[`utils/enhancedAIPrompts.ts`](utils/enhancedAIPrompts.ts)**: Professional-grade prompt engineering for restaurant-quality recipes
- **[`components/EnhancedAIRecipes.tsx`](components/EnhancedAIRecipes.tsx)**: Complete UI overhaul with categorized recipe generation
- **Smart Recipe Generation**: Context-aware prompts based on meal type, season, cuisine, and health goals
- **Nutrition Integration**: Auto-calculated nutrition information with detailed breakdown
- **Professional Presentation**: Enhanced recipe display with timing, tips, and detailed instructions

### 📊 **Recipe Quality Improvements**
- **Structured Ingredients**: Quantity + Unit + Name + Preparation notes format
- **Detailed Instructions**: Step numbers, timing, temperature, and professional tips
- **Comprehensive Nutrition**: Accurate macronutrient calculations per serving
- **Recipe Categories**: Quick meals (15-30min), seasonal ingredients, cuisine-specific, health-optimized
- **Validation System**: Ensures all generated recipes are complete and practical

### 🎯 **Major Home Screen Enhancement - "Today's Dashboard"**
- **Complete Dashboard Redesign**: Transformed home screen from static welcome page to functional command center
- **Today's Meal Plan**: Shows planned breakfast, lunch, dinner with quick add meal buttons
- **Nutrition Progress**: Real-time tracking of calories, protein, and daily targets with visual progress indicators
- **Quick Actions Hub**: One-tap access to Add Recipe, Plan Meals, Shopping List, and Browse Recipes
- **Personal Stats**: Cooking streak counter, recipe collection count, and achievement tracking
- **Smart Integration**: Seamlessly connects with meal planner and recipe management features

### 🎯 **New Dashboard Components**
- **[`TodaysMealPlan.tsx`](components/dashboard/TodaysMealPlan.tsx)**: Interactive meal planning preview with meal type icons and calorie display
- **[`QuickStats.tsx`](components/dashboard/QuickStats.tsx)**: Nutrition progress circles and personal achievement metrics
- **[`QuickActions.tsx`](components/dashboard/QuickActions.tsx)**: Grid of quick-access buttons for core app features
- **[`useDashboardData.ts`](hooks/useDashboardData.ts)**: Custom hook for aggregating dashboard data from multiple sources

### 🎨 **Enhanced User Experience**
- **Contextual Navigation**: Quick access to meal planner when meals are missing
- **Progress Visualization**: Circular progress indicators for nutrition goals
- **Smart Empty States**: Helpful "Add meal" prompts for unplanned meals
- **Consistent Design**: Uses centralized design system for cohesive visual experience
- **Responsive Layout**: Optimized for different screen sizes and orientations

## [2025-06-16] Critical Bug Fixes & AI Integration Improvements

### 🐛 **Major Bug Fixes**
- **Fixed AI Meal Suggestions Add Button**: Resolved issue where "+ add" buttons in meal planner AI suggestions were not working
- **Fixed JSON Parsing Crashes**: Eliminated "JSON Parse error: Unexpected character" crashes in MyRecipes screen
- **Database Integration**: AI-generated recipes now properly save to database before being added to meal plans
- **Data Format Consistency**: Standardized ingredient and instruction storage format across all recipe sources

### 🔧 **Technical Improvements**
- **Robust Error Handling**: Added try-catch blocks around JSON parsing operations to prevent crashes
- **Fallback Data Handling**: App gracefully handles both JSON arrays and plain strings for ingredients
- **Loading States**: Added visual feedback (spinners) when saving AI recipes to database
- **Database Persistence**: AI suggestions now create real recipe records instead of mock objects

### 🎯 **User Experience Enhancements**
- **Seamless AI Integration**: AI-generated recipes now work exactly like manually created recipes
- **Visual Feedback**: Users see loading indicators when AI recipes are being saved
- **Improved Reliability**: Meal planner AI suggestions consistently add recipes to meal plans
- **Search Functionality**: Fixed search to work properly with AI-generated recipe data

### 🚀 **AI Recipe Caching & Quota Management**
- **Intelligent Caching System**: AI recipe recommendations are now cached for 24 hours to preserve user's API quota
- **Manual Refresh Control**: Users can manually refresh recommendations when they want new suggestions
- **Cache Status Display**: Shows when recipes were cached and reminds users about quota savings
- **Clear Cache Option**: Users can clear cached data if they want to force new recommendations

### 🏗️ **Technical Implementation**
- **Custom Hook**: Created [`useAIRecipeCache`](hooks/useAIRecipeCache.ts) for persistent local storage management
- **AsyncStorage Integration**: Recipes are stored locally using React Native AsyncStorage
- **User-Specific Caching**: Each user's cache is isolated by their user ID
- **Cache Validation**: Automatic expiry after 24 hours with cleanup of expired data

### 🎨 **Enhanced UI/UX**
- **Cache Information**: Shows "📱 Cached X hours ago • Saves your AI quota" in the subtitle
- **Smart Button Text**: Changes from "Discover New" to "Refresh" when cached data exists
- **Quota Reminder**: Empty state reminds users that caching saves their AI quota
- **Clear Cache Button**: Red-styled button to remove cached data when needed

### 🔧 **Navigation Improvements**
- **Home as Default**: Users now land on Home screen after login instead of Recipes tab
- **Better User Journey**: More intuitive flow from authentication to main dashboard

## [2025-06-17] Navigation & Home Tab Improvements
- Added Home tab as the default/first tab in the bottom navigation bar.
- Set Home as the initial route after login for a more intuitive user experience.
- Removed the top hero Home icon for a cleaner UI.
- Clarified navigation behavior and fixed tab order to ensure Home is always shown first after login.

## [2025-06-17] UI/UX & AI Suggestions Improvements
- Restored refresh and prompt edit icons: Brought back per-meal slot controls for AI meal suggestions, allowing users to regenerate suggestions and edit prompts directly from each slot.
- Meal planning card enhancements: Added meal type icons, nutrition info, and recipe image thumbnails to each meal slot for improved clarity and engagement.
- AI suggestions reliability: Fixed issues with AI suggestions not loading due to profile settings or missing toggles; improved error handling and defensive coding for AI recipe parsing.
- Profile settings integration: Ensured Gemini API key and smart recommendations toggles are respected and persist after schema updates.
- 'Coming Soon' card improvements: Clarified the Smart Meal Planning progress card and outlined next steps for user engagement and waitlist functionality.

---

## Previous Versions

### Version 1.x.x
- Basic recipe management functionality
- Initial AI integration
- Profile and dietary preferences
- Shopping list features

---

## Contributing
This changelog follows [Keep a Changelog](https://keepachangelog.com/) format.

## Support
For issues or feature requests, please contact the development team.