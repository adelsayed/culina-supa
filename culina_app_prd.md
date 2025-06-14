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

