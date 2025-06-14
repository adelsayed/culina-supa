import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  UserProfile: a
    .model({
      userId: a.string().required(), // Supabase user ID
      username: a.string(),
      displayName: a.string(),
      bio: a.string(),
      profileImageUrl: a.string(),
      
      // Health Data
      age: a.integer(),
      weight: a.float(), // kg or lbs based on preferredUnits
      height: a.float(), // cm or inches based on preferredUnits
      gender: a.enum(['male', 'female', 'other', 'prefer_not_to_say']),
      activityLevel: a.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
      
      // Health Goals
      weightGoal: a.enum(['maintain', 'lose', 'gain']),
      targetWeight: a.float(),
      dailyCalorieTarget: a.integer(),
      proteinTarget: a.float(), // grams
      carbsTarget: a.float(), // grams
      fatTarget: a.float(), // grams
      
      // Dietary Restrictions & Preferences
      dietaryRestrictions: a.string().array(), // ["vegetarian", "gluten-free", "dairy-free", etc.]
      allergies: a.string().array(), // ["nuts", "shellfish", "eggs", etc.]
      dislikedIngredients: a.string().array(),
      preferredCuisines: a.string().array(), // ["italian", "mexican", "asian", etc.]
      
      // Settings
      notificationsEnabled: a.boolean().default(true),
      emailNotificationsEnabled: a.boolean().default(true),
      pushNotificationsEnabled: a.boolean().default(true),
      privacyProfilePublic: a.boolean().default(false),
      privacyShareData: a.boolean().default(false),
      
      // Preferences
      preferredUnits: a.enum(['metric', 'imperial']),
      theme: a.enum(['light', 'dark', 'system']),
      language: a.string().default('en'),
      
      // AI Integration Settings
      openaiApiKey: a.string(), // Encrypted storage for user's OpenAI API key
      aiModel: a.enum(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']),
      aiFeaturesEnabled: a.boolean().default(false),
      smartMealPlanningEnabled: a.boolean().default(false),
      smartRecommendationsEnabled: a.boolean().default(false),
    })
    .authorization(allow => [
      allow.publicApiKey(),
    ]),

  Todo: a
    .model({
      content: a.string(),
      userId: a.string(), // Store Supabase user ID
    })
    .authorization(allow => [
      allow.publicApiKey(),
    ]),
  
  Recipe: a
    .model({
      name: a.string(),
      ingredients: a.string(), // Will store as JSON string
      instructions: a.string(), // Will store as JSON string
      imageUrl: a.string(),
      userId: a.string(), // Store Supabase user ID
      // Enhanced nutrition and metadata fields
      calories: a.float(),
      protein: a.float(), // grams
      carbs: a.float(), // grams
      fat: a.float(), // grams
      servings: a.float().default(1),
      prepTime: a.integer(), // minutes
      cookTime: a.integer(), // minutes
      difficulty: a.enum(['easy', 'medium', 'hard']),
      category: a.string(), // e.g., "Breakfast", "Lunch", "Dinner", "Snack"
      tags: a.string().array(), // e.g., ["vegetarian", "gluten-free"]
    })
    .authorization(allow => [
      allow.publicApiKey(),
    ]),

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
    .authorization(allow => [
      allow.publicApiKey(),
    ]),

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
    .authorization(allow => [
      allow.publicApiKey(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey', // Use API key instead of Cognito
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
