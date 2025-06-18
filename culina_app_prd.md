# Culina Recipe App – Product Requirements Document (PRD)

## 🌟 Overview
**Culina** is a recipe and meal planning mobile app built with **Expo (React Native)** for the frontend, **Supabase** for user authentication, and **AWS Amplify Gen 2** for backend data and file storage. The app enables users to manage recipes, plan meals, track calorie intake, and generate shopping lists.

---

## 👩‍💻 Target Users
- Health-conscious individuals
- Meal preppers
- Amateur and experienced cooks
- Users managing nutrition or diet

---

## 🔧 Tech Stack
| Layer       | Technology            |
|-------------|------------------------|
| Frontend    | Expo (React Native)   |
| Auth        | Supabase Auth         |
| Backend API | AWS Amplify Gen 2     |
| File Storage| Amplify Gen 2 Storage |

---

## 📊 Core Features

### 1. User Authentication & Profile (via Supabase)
- Sign up / Sign in / Forgot password
- **Basic Profile**: name, username, email, bio, profile image
- **Health Data**: age, weight, height, gender, activity level, dietary restrictions
- **Goals**: weight goal, calorie target, macro targets (protein, carbs, fat)
- **Settings**: notifications, privacy, units (metric/imperial), theme
- **AI Integration**: OpenAI API key, preferred AI models, smart features toggle

### 2. Recipe Management
- **Create Recipe**: Title, Description, Ingredients, Instructions, Category, Images, Video
- **View Recipe**: Full detail page with macro nutrition summary
- **Edit/Delete Recipe** (by creator)
- **Favorites**: Mark/unmark recipes
- **Search**: By name, category, ingredient, tag

### 3. Meal Planner
- Daily & weekly calendar layout
- Assign recipes to: Breakfast, Snack, Lunch, Snack, Dinner
- View planned meals by date
- Calories per meal + daily total

### 4. Shopping List
- Auto-generated from selected meal plan
- Organized by day or aggregated
- Editable (custom items, check/uncheck)
- **Phase 2**: Online grocery integration (Talabat, Instashop, Carrefour)

### 5. Calorie & Macro Tracker
- Pulls data from recipe fields
- Shows per-meal and daily totals

### 6. Multimedia Support
- Add images or video to recipes
- View embedded media in detail view

---

## 💡 UI Screens (from Figma Design)
- Login / Sign Up
- Home / Dashboard
- Recipe List / Detail / Add Recipe
- Meal Planner Calendar
- Shopping List
- Profile / Settings

---

## 📅 Backend Schema (AWS Amplify Gen 2)

### Recipe Model
```ts
Recipe: a.model({
  title: a.string().required(),
  description: a.string(),
  ingredients: a.string().array(),
  instructions: a.string().array(),
  imageUrl: a.string(),
  videoUrl: a.string(),
  supabaseUserId: a.string().required(),
}).authorization([a.allow.public()])
```

### MealPlanEntry
```ts
MealPlanEntry: a.model({
  userId: a.string().required(),
  date: a.date().required(),
  mealType: a.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner']),
  recipeId: a.string().required(),
}).authorization([a.allow.public()])
```

### ShoppingListItem
```ts
ShoppingListItem: a.model({
  userId: a.string().required(),
  day: a.date().required(),
  itemName: a.string().required(),
  quantity: a.string(),
  isCompleted: a.boolean(),
}).authorization([a.allow.public()])
```

---

### 7. AI-Powered Smart Features
- **Smart Meal Planning**: Auto-generate weekly meal plans based on user health data
- **Personalized Recommendations**: Recipe suggestions based on dietary preferences and goals
- **Nutrition Optimization**: AI-powered macro balancing for meal plans
- **Leftover Management**: Smart suggestions for using leftover ingredients
- **Shopping List Optimization**: AI-enhanced ingredient consolidation and substitutions

---

## 🔄 Phase 2 Roadmap
- **AI Integration**: OpenAI-powered meal planning and recipe recommendations
- **Advanced Health Tracking**: BMI calculation, calorie needs estimation, progress tracking
- **Smart Features**: Barcode scanner, nutrition auto-entry, ingredient substitutions
- **Social Features**: Recipe sharing, community discovery, ratings and reviews
- **Grocery Integration**: Delivery APIs (Talabat, Instashop, Carrefour)
- **Analytics**: Nutrition trends, eating patterns, goal progress tracking

---

## ✅ MVP Completion Criteria
- [ ] User authentication fully functional (Supabase)
- [ ] Recipe CRUD working with Amplify Gen 2
- [ ] Meal planner calendar view implemented
- [ ] Shopping list syncs with meal planner
- [ ] Basic calorie tracker visible
- [ ] UI built to spec from Figma design

---
Let me know if you'd like this exported to Notion, Markdown `.md` file, or pre-filled GitHub issues for planning.

---

## 📝 Recent Updates

### 2025-06-16 - Enhanced AI Recipe Generation System
#### Major UI/UX Improvements
- **Relocated prompt editing**: Moved AI prompt customization from recipe detail modal to main screen header for immediate access
- **New prompt editor modal**: Full-screen editing experience with:
  - Large text area (400px height) for comfortable editing
  - "Save & Generate" button for immediate recommendation refresh
  - "Reset to Default" option to restore original prompt template
  - Smart cancel functionality that preserves current active prompt
- **Streamlined workflow**: Users can now edit prompts and see results instantly without navigating through multiple screens

#### Enhanced Error Handling & User Feedback
- **Intelligent error parsing**: Comprehensive JSON validation with step-by-step error detection
- **User-friendly error messages**: Context-aware feedback with emojis and actionable guidance:
  - 🔑 API key validation issues (401 errors)
  - ⏳ Rate limiting guidance (429 errors)
  - 💰 Quota exceeded notifications (402 errors)
  - 🔄 JSON format troubleshooting with specific suggestions
  - 📝 Missing recipe field detection and recovery steps
- **Enhanced debugging**: Detailed console logging with timestamps, raw responses, and error context for developer troubleshooting

#### Technical Improvements
- **Updated AI models**: Migrated from legacy model names to current Gemini versions:
  - `gemini_2_0_flash` (default, fastest)
  - `gemini_1_5_pro` (advanced reasoning)
  - `gemini_1_5_flash` (balanced performance)
- **Improved recipe format**: Added `imageUrl` field to JSON template for better visual presentation
- **Reactive state management**: Added dependency tracking for automatic re-generation when prompts change
- **Code optimization**: Removed redundant prompt management, consolidated state, cleaned unused styles
- **Type safety**: Enhanced TypeScript interfaces and proper model type constraints

#### Files Modified
- `components/GeminiRecommendedRecipes.tsx` - Complete prompt editing system overhaul
- `screens/ProfileScreen.tsx` - Updated AI model types and settings interface
- `culina_app_prd.md` - Documentation updates

#### Developer Notes
- All prompt editing UI removed from recipe detail modals
- New modal-based editing system with improved UX patterns
- Enhanced error logging for production debugging
- Backward compatible with existing user profiles and settings

### 2025-06-17 - UI/UX & AI Suggestions Improvements
#### Restored & Enhanced Features
- **Restored refresh and prompt edit icons**: Brought back per-meal slot controls for AI meal suggestions, allowing users to regenerate suggestions and edit prompts directly from each slot.
- **Meal planning card enhancements**: Added meal type icons, nutrition info, and recipe image thumbnails to each meal slot for improved clarity and engagement.
- **AI suggestions reliability**: Fixed issues with AI suggestions not loading due to profile settings or missing toggles; improved error handling and defensive coding for AI recipe parsing.
- **Profile settings integration**: Ensured Gemini API key and smart recommendations toggles are respected and persist after schema updates.
- **'Coming Soon' card improvements**: Clarified the Smart Meal Planning progress card and outlined next steps for user engagement and waitlist functionality.


