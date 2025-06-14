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

### 1. User Authentication (via Supabase)
- Sign up / Sign in / Forgot password
- Profile: name, username, email, password, settings (notifications, privacy)

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

## 🔄 Phase 2 Roadmap
- Barcode scanner integration for nutritional auto-entry
- Social recipe sharing / discovery
- Commenting, ratings, and likes on recipes
- Grocery delivery integrations (via API)
- Weekly meal generation by nutrition goal

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

