# Meal Planner Feature Implementation Plan

## 📋 Current State Analysis

### ✅ Already Implemented
- **Authentication**: Supabase auth with proper session management
- **Recipe Management**: Full CRUD operations with Amplify
- **Navigation**: Expo Router with tab-based navigation
- **Data Models**: Recipe model with ingredients, instructions, images
- **UI Components**: Recipe listing, details, and creation

### 🔄 Currently Being Fixed
- Loading screen issue (auth initialization)
- Subscription management optimization

## 🎯 Meal Planner Feature Requirements (from PRD)

### Core Functionality
1. **Daily & Weekly Calendar Layout**
2. **Meal Assignment**: Breakfast, Snack, Lunch, Snack, Dinner
3. **View Planned Meals by Date**
4. **Calories per Meal + Daily Total**
5. **Auto-generated Shopping Lists**

## 🏗️ Implementation Plan

### Phase 1: Data Models & Backend (Week 1)

#### 1.1 Update Amplify Schema
Add new models to `amplify/data/resource.ts`:

```typescript
// MealPlanEntry Model
MealPlanEntry: a
  .model({
    userId: a.string().required(),
    date: a.date().required(),
    mealType: a.enum(['breakfast', 'snack1', 'lunch', 'snack2', 'dinner']),
    recipeId: a.string().required(),
    servings: a.float().default(1),
    plannedCalories: a.float(),
    notes: a.string(),
  })
  .authorization(allow => [allow.publicApiKey()]),

// ShoppingListItem Model  
ShoppingListItem: a
  .model({
    userId: a.string().required(),
    weekStartDate: a.date().required(),
    itemName: a.string().required(),
    quantity: a.string(),
    unit: a.string(),
    category: a.string(), // e.g., "Produce", "Dairy", "Meat"
    isCompleted: a.boolean().default(false),
    recipeId: a.string(), // Optional: track which recipe this item came from
    mealPlanEntryId: a.string(), // Link to specific meal plan entry
  })
  .authorization(allow => [allow.publicApiKey()]),

// Enhanced Recipe Model (add nutrition info)
Recipe: a
  .model({
    // ... existing fields
    calories: a.float(),
    protein: a.float(),
    carbs: a.float(),
    fat: a.float(),
    servings: a.float().default(1),
    prepTime: a.integer(), // minutes
    cookTime: a.integer(), // minutes
    difficulty: a.enum(['easy', 'medium', 'hard']),
    category: a.string(), // e.g., "Breakfast", "Lunch", "Dinner", "Snack"
    tags: a.string().array(), // e.g., ["vegetarian", "gluten-free"]
  })
```

#### 1.2 Database Migration
- Create migration script for existing recipes
- Add default nutrition values
- Update existing data structure

### Phase 2: Core Components (Week 2)

#### 2.1 Calendar Component
Create `components/MealPlannerCalendar.tsx`:
- Weekly view with 7 days
- Daily view for detailed planning
- Meal slots: Breakfast, Snack, Lunch, Snack, Dinner
- Drag & drop recipe assignment
- Calorie totals per day

#### 2.2 Meal Slot Component
Create `components/MealSlot.tsx`:
- Display assigned recipe
- Show calories and macros
- Quick actions: edit, remove, swap
- Empty state with "Add Recipe" button

#### 2.3 Recipe Picker Modal
Create `components/RecipePicker.tsx`:
- Search and filter recipes
- Category filtering
- Nutrition information display
- Quick preview

### Phase 3: Main Screens (Week 3)

#### 3.1 Meal Planner Tab
Create `app/(tabs)/meal-planner.tsx`:
- Calendar navigation (week/month view)
- Daily meal overview
- Quick stats: total calories, macros
- Action buttons: generate shopping list, copy week

#### 3.2 Daily Meal Detail
Create `app/(tabs)/meal-planner/[date].tsx`:
- Full day view with all meals
- Detailed nutrition breakdown
- Meal timing suggestions
- Notes and adjustments

#### 3.3 Shopping List Tab
Create `app/(tabs)/shopping-list.tsx`:
- Categorized ingredient list
- Check/uncheck items
- Add custom items
- Export/share functionality

### Phase 4: Advanced Features (Week 4)

#### 4.1 Nutrition Dashboard
Create `components/NutritionDashboard.tsx`:
- Daily/weekly nutrition charts
- Macro breakdown (protein, carbs, fat)
- Calorie goals and tracking
- Progress indicators

#### 4.2 Meal Planning Intelligence
- Suggest recipes based on nutrition goals
- Auto-balance macros across meals
- Leftover management
- Batch cooking suggestions

#### 4.3 Shopping List Optimization
- Ingredient consolidation
- Store layout optimization
- Price estimation (future)
- Grocery delivery integration (Phase 2)

## 📱 UI/UX Design Specifications

### Navigation Updates
```typescript
// Update app/(tabs)/_layout.tsx
<Tabs.Screen
  name="meal-planner"
  options={{
    title: 'Meal Planner',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons 
        name={focused ? 'calendar' : 'calendar-outline'} 
        size={size} 
        color={color} 
      />
    ),
  }}
/>
<Tabs.Screen
  name="shopping-list"
  options={{
    title: 'Shopping',
    tabBarIcon: ({ focused, color, size }) => (
      <Ionicons 
        name={focused ? 'basket' : 'basket-outline'} 
        size={size} 
        color={color} 
      />
    ),
  }}
/>
```

### Color Scheme
```typescript
const mealPlannerColors = {
  breakfast: '#FFE4B5', // Moccasin
  snack1: '#E6F3FF',    // Light Blue
  lunch: '#F0FFF0',     // Honeydew
  snack2: '#FFF0F5',    // Lavender Blush
  dinner: '#F5F5DC',    // Beige
  primary: '#007AFF',
  secondary: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
};
```

## 🔧 Technical Implementation Details

### State Management
```typescript
// hooks/useMealPlanner.ts
export const useMealPlanner = (weekStartDate: Date) => {
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CRUD operations for meal plan entries
  const addMealPlanEntry = async (entry: CreateMealPlanEntry) => { ... };
  const updateMealPlanEntry = async (id: string, updates: Partial<MealPlanEntry>) => { ... };
  const removeMealPlanEntry = async (id: string) => { ... };
  
  // Utility functions
  const getMealsForDate = (date: Date) => { ... };
  const getDailyCalories = (date: Date) => { ... };
  const getWeeklyNutrition = () => { ... };
  
  return {
    mealPlan,
    loading,
    addMealPlanEntry,
    updateMealPlanEntry,
    removeMealPlanEntry,
    getMealsForDate,
    getDailyCalories,
    getWeeklyNutrition,
  };
};
```

### Shopping List Generation
```typescript
// utils/shoppingListGenerator.ts
export const generateShoppingList = (
  mealPlanEntries: MealPlanEntry[],
  recipes: Recipe[]
): ShoppingListItem[] => {
  // Aggregate ingredients from all planned meals
  // Consolidate duplicate items
  // Categorize by food type
  // Calculate quantities based on servings
};
```

### Nutrition Calculations
```typescript
// utils/nutritionCalculator.ts
export const calculateDailyNutrition = (
  mealPlanEntries: MealPlanEntry[],
  recipes: Recipe[]
) => {
  // Sum calories and macros for the day
  // Account for serving size adjustments
  // Return formatted nutrition data
};
```

## 📊 Data Flow Architecture

```
User Action (Add Recipe to Meal Plan)
    ↓
MealPlannerScreen Component
    ↓
useMealPlanner Hook
    ↓
Amplify Client (Create MealPlanEntry)
    ↓
AWS AppSync GraphQL API
    ↓
DynamoDB (Store MealPlanEntry)
    ↓
Real-time Subscription Update
    ↓
UI Re-render with New Data
```

## 🧪 Testing Strategy

### Unit Tests
- Nutrition calculation functions
- Shopping list generation logic
- Date utility functions
- Component rendering

### Integration Tests
- Meal plan CRUD operations
- Recipe assignment flow
- Shopping list generation
- Calendar navigation

### E2E Tests
- Complete meal planning workflow
- Shopping list creation and management
- Cross-tab data consistency

## 📈 Success Metrics

### User Engagement
- Daily active users using meal planner
- Average meals planned per week
- Shopping list generation rate
- Recipe-to-meal-plan conversion rate

### Feature Adoption
- Time spent in meal planner tab
- Number of meals planned per user
- Shopping list completion rate
- Recipe discovery through meal planning

## 🚀 Deployment Plan

### Phase 1 Rollout (MVP)
1. Deploy updated Amplify schema
2. Release basic meal planner functionality
3. Monitor usage and performance
4. Gather user feedback

### Phase 2 Enhancements
1. Advanced nutrition tracking
2. Shopping list optimizations
3. Meal planning intelligence
4. Social features (sharing meal plans)

### Phase 3 Integrations
1. Grocery delivery APIs
2. Barcode scanning
3. Voice commands
4. Wearable device sync

## 📋 Development Checklist

### Backend Setup
- [ ] Update Amplify schema with new models
- [ ] Deploy schema changes
- [ ] Create data migration scripts
- [ ] Test GraphQL operations

### Frontend Development
- [ ] Create meal planner components
- [ ] Implement calendar navigation
- [ ] Build recipe picker modal
- [ ] Add shopping list functionality
- [ ] Integrate nutrition calculations

### Testing & QA
- [ ] Unit test all utilities
- [ ] Integration test API operations
- [ ] E2E test user workflows
- [ ] Performance testing
- [ ] Accessibility testing

### Documentation
- [ ] Update user documentation
- [ ] Create developer guides
- [ ] API documentation
- [ ] Deployment guides

This comprehensive plan provides a structured approach to implementing the meal planner feature while maintaining code quality and user experience standards.