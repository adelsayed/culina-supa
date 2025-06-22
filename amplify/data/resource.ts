import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Recipe: a.model({
    userId: a.string().required(),
    name: a.string().required(),
    description: a.string(),
    ingredients: a.json(),
    instructions: a.json(),
    tags: a.string().array(),
    imageUrl: a.string(),
    source: a.string(),
    category: a.string(),
    servings: a.integer(),
    prepTime: a.integer(),
    cookTime: a.integer(),
    difficulty: a.enum(['Easy', 'Medium', 'Hard']),
  }).authorization(allow => [allow.publicApiKey()]),

  UserProfile: a.model({
    userId: a.string().required(),
    username: a.string(),
    email: a.string(),
    geminiApiKey: a.string(),
    bio: a.string(),
    profileImageUrl: a.string(),
    age: a.integer(),
    weight: a.float(),
    height: a.float(),
    gender: a.enum(['male', 'female', 'other']),
    activityLevel: a.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']),
    dietaryPreferences: a.string().array(),
    healthGoals: a.string().array(),
    cookingSkill: a.enum(['beginner', 'intermediate', 'advanced']),
  }).authorization(allow => [allow.publicApiKey()]),

  Todo: a.model({
    userId: a.string().required(),
    content: a.string(),
    isDone: a.boolean(),
  }).authorization(allow => [allow.publicApiKey()]),

  SmartRecipe: a.model({
    userId: a.string().required(),
    recipeJson: a.json().required(),
  }).authorization(allow => [allow.publicApiKey()]),

  MealPlanEntry: a.model({
    userId: a.string().required(),
    date: a.date().required(),
    mealType: a.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeId: a.string().required(),
    recipeName: a.string(),
  }).authorization(allow => [allow.publicApiKey()]),

  ShoppingListItem: a.model({
    userId: a.string().required(),
    name: a.string().required(),
    quantity: a.float(),
    unit: a.string(),
    isBought: a.boolean().default(false),
  }).authorization(allow => [allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
