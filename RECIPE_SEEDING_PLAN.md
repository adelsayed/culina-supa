# Recipe Database Seeding Plan
## 50 Recipes from Each Major Cuisine

### 🎯 **Objective**
Create a comprehensive recipe database with 50 high-quality recipes from each major world cuisine, complete with:
- Professional food images
- Detailed ingredients and instructions
- Nutritional information
- Proper categorization and tags

### 📊 **Target Cuisines (10 Total = 500 Recipes)**

1. **Italian** (50 recipes)
   - Pasta dishes, pizzas, risottos, antipasti, desserts
   - Focus: Authentic regional specialties

2. **Asian** (50 recipes)
   - Chinese, Japanese, Thai, Korean, Vietnamese
   - Focus: Popular dishes with authentic flavors

3. **Mexican** (50 recipes)
   - Traditional dishes, street food, regional specialties
   - Focus: Authentic techniques and ingredients

4. **Indian** (50 recipes)
   - North Indian, South Indian, street food, desserts
   - Focus: Spice blends and traditional cooking methods

5. **French** (50 recipes)
   - Classic techniques, regional dishes, pastries
   - Focus: Fundamental cooking methods

6. **Middle Eastern** (50 recipes)
   - Lebanese, Turkish, Persian, Israeli
   - Focus: Traditional flavors and techniques

7. **Mediterranean** (50 recipes)
   - Greek, Spanish, North African
   - Focus: Healthy, fresh ingredients

8. **American** (50 recipes)
   - Regional American, BBQ, comfort food
   - Focus: Classic American dishes

9. **British/European** (50 recipes)
   - Traditional British, German, Eastern European
   - Focus: Hearty, traditional dishes

10. **Latin American** (50 recipes)
    - Brazilian, Argentinian, Peruvian, Caribbean
    - Focus: Vibrant flavors and techniques

### 🏗️ **Implementation Strategy**

#### **Phase 1: Data Structure Design**
```typescript
interface RecipeData {
  id: string;
  name: string;
  cuisine: string;
  category: string; // appetizer, main, dessert, etc.
  difficulty: 'Easy' | 'Medium' | 'Hard';
  prepTime: number; // minutes
  cookTime: number;
  servings: number;
  ingredients: string[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  imageUrl: string;
  tags: string[];
  source: string;
  description: string;
}
```

#### **Phase 2: Image Strategy**
1. **Use Unsplash API** for high-quality food images
2. **Fallback to other free image sources**:
   - Pexels
   - Pixabay
   - FoodiesFeed
3. **Image Requirements**:
   - Minimum 800x600 resolution
   - Professional food photography
   - Good lighting and composition
   - Recipe-specific (not generic food images)

#### **Phase 3: Data Sources**
1. **Recipe Content**:
   - Allrecipes.com (public domain recipes)
   - Food Network (adapted recipes)
   - Traditional cookbooks (public domain)
   - Cultural recipe websites
   
2. **Nutritional Data**:
   - USDA Food Database
   - Nutritional calculation based on ingredients
   - Estimated values for traditional recipes

#### **Phase 4: File Structure**
```
data/
├── recipes/
│   ├── italian.ts (50 recipes)
│   ├── asian.ts (50 recipes)
│   ├── mexican.ts (50 recipes)
│   ├── indian.ts (50 recipes)
│   ├── french.ts (50 recipes)
│   ├── middleEastern.ts (50 recipes)
│   ├── mediterranean.ts (50 recipes)
│   ├── american.ts (50 recipes)
│   ├── british.ts (50 recipes)
│   └── latinAmerican.ts (50 recipes)
├── seedRecipes.ts (master seeding function)
└── recipeTypes.ts (type definitions)
```

#### **Phase 5: Quality Standards**
1. **Recipe Validation**:
   - All ingredients clearly specified with quantities
   - Step-by-step instructions
   - Realistic prep/cook times
   - Proper serving sizes

2. **Image Quality**:
   - High resolution (min 800x600)
   - Professional appearance
   - Recipe-specific content
   - Good lighting and composition

3. **Nutritional Accuracy**:
   - Calculated based on ingredients
   - Realistic portion sizes
   - Verified against known databases

#### **Phase 6: Implementation Steps**

1. **Create Type Definitions** (`data/recipeTypes.ts`)
2. **Build Image Fetching Utility** (Unsplash API integration)
3. **Create Recipe Data Files** (10 files, 50 recipes each)
4. **Build Seeding Function** with:
   - Duplicate checking
   - User assignment
   - Error handling
   - Progress tracking
5. **Create Admin Seeding Interface**
6. **Test and Validate Data Quality**

#### **Phase 7: Seeding Strategy**
```typescript
// Seeding options
interface SeedingOptions {
  cuisines?: string[]; // which cuisines to seed
  replaceExisting?: boolean; // replace existing recipes
  userId?: string; // assign to specific user or make global
  batchSize?: number; // recipes per batch
  withImages?: boolean; // include image fetching
}
```

### 🔧 **Technical Implementation**

#### **1. Image Integration**
- Use Unsplash API for food photography
- Cache image URLs in recipe data
- Implement image fallback system
- Optimize for mobile loading

#### **2. Database Seeding**
- Batch processing to avoid timeouts
- Progress tracking and resumable seeding
- Duplicate prevention
- Error handling and logging

#### **3. Quality Assurance**
- Recipe validation functions
- Nutrition calculation verification
- Image quality checks
- Content moderation

### 📋 **Sample Recipe Structure**
```typescript
{
  id: "italian_001",
  name: "Classic Margherita Pizza",
  cuisine: "Italian",
  category: "Main Course",
  difficulty: "Medium",
  prepTime: 120, // includes dough rising
  cookTime: 12,
  servings: 4,
  ingredients: [
    "500g 00 flour",
    "325ml warm water",
    "10g salt",
    "3g active dry yeast",
    "400g San Marzano tomatoes",
    "200g fresh mozzarella",
    "Fresh basil leaves",
    "Extra virgin olive oil"
  ],
  instructions: [
    "Mix flour and salt in a large bowl",
    "Dissolve yeast in warm water, let stand 5 minutes",
    // ... detailed steps
  ],
  nutrition: {
    calories: 320,
    protein: 12,
    carbs: 45,
    fat: 10
  },
  imageUrl: "https://images.unsplash.com/photo-margherita-pizza",
  tags: ["vegetarian", "italian", "pizza", "classic"],
  source: "Traditional Italian",
  description: "Authentic Neapolitan-style pizza with fresh mozzarella, tomatoes, and basil"
}
```

### 🚀 **Benefits**
1. **Rich Recipe Database** - 500 high-quality recipes
2. **Visual Appeal** - Professional food photography
3. **Cultural Diversity** - Authentic recipes from 10 cuisines
4. **User Engagement** - Attractive, usable recipe collection
5. **App Value** - Comprehensive cooking resource

### ⏱️ **Timeline Estimate**
- **Data Collection**: 2-3 days per cuisine (20-30 days total)
- **Image Integration**: 3-5 days
- **Technical Implementation**: 5-7 days
- **Testing & QA**: 3-5 days
- **Total**: 6-8 weeks for complete implementation

### 🎯 **Next Steps**
1. **Approve this plan**
2. **Start with 1-2 cuisines as proof of concept**
3. **Build technical infrastructure**
4. **Scale to all cuisines**
5. **Implement seeding functionality**

Would you like me to proceed with implementing this plan? I recommend starting with Italian and Asian cuisines as a proof of concept.