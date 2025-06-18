import type { Schema } from '../amplify/data/resource';

export type UserProfile = Schema['UserProfile']['type'];
export type Recipe = Schema['Recipe']['type'];

/**
 * Local filtering and scoring for personalized recommendations.
 */
export function getPersonalizedRecipesLocal(
  user: UserProfile,
  recipes: Recipe[],
  maxResults: number = 10
): Recipe[] {
  if (!user) return [];

  // Filter out recipes with allergens or disliked ingredients
  const filtered = recipes.filter(recipe => {
    const ingredients = (recipe.ingredients || '').toLowerCase();
    // Allergies
    if (user.allergies && user.allergies.some(a => ingredients.includes(a.toLowerCase()))) return false;
    // Dislikes
    if (user.dislikedIngredients && user.dislikedIngredients.some(d => ingredients.includes(d.toLowerCase()))) return false;
    // Dietary restrictions (simple match)
    if (user.dietaryRestrictions && user.dietaryRestrictions.length > 0) {
      const tags = (recipe.tags || []).map(t => t.toLowerCase());
      if (!user.dietaryRestrictions.some(r => tags.includes(r.toLowerCase()))) return false;
    }
    return true;
  });

  // Score by preferred cuisines and macro/calorie fit
  const scored = filtered.map(recipe => {
    let score = 0;
    // Preferred cuisines
    if (user.preferredCuisines && recipe.category) {
      if (user.preferredCuisines.some(c => recipe.category.toLowerCase().includes(c.toLowerCase()))) {
        score += 2;
      }
    }
    // Macro/calorie fit (if user has targets)
    if (user.dailyCalorieTarget && recipe.calories) {
      const diff = Math.abs(recipe.calories - user.dailyCalorieTarget);
      if (diff < 100) score += 2;
      else if (diff < 250) score += 1;
    }
    return { recipe, score };
  });

  // Sort by score descending, then by recipe name
  scored.sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));
  return scored.slice(0, maxResults).map(s => s.recipe);
}

/**
 * AI-powered personalized recommendations using OpenAI (if enabled).
 * Returns a promise of recipe IDs in recommended order.
 */
export async function getPersonalizedRecipesAI(
  user: UserProfile,
  recipes: Recipe[],
  openaiApiKey: string,
  maxResults: number = 10
): Promise<Recipe[]> {
  // Compose a prompt for OpenAI
  const prompt = `
You are a nutrition assistant. The user has the following preferences:
- Dietary restrictions: ${user.dietaryRestrictions?.join(', ') || 'none'}
- Allergies: ${user.allergies?.join(', ') || 'none'}
- Disliked ingredients: ${user.dislikedIngredients?.join(', ') || 'none'}
- Preferred cuisines: ${user.preferredCuisines?.join(', ') || 'none'}
- Calorie target: ${user.dailyCalorieTarget || 'none'}

Given this list of recipes:
${recipes.map((r, i) => `${i + 1}. ${r.name} (ingredients: ${r.ingredients}; calories: ${r.calories || 'unknown'}; category: ${r.category || 'none'})`).join('\n')}

Recommend the top ${maxResults} recipes for this user. 
Return ONLY a JSON array of recipe names in order of recommendation.
`;

  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: user.aiModel || 'gpt35turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 256,
      temperature: 0.2,
    })
  });

  const data = await response.json();
  // Try to extract JSON array of recipe names
  let names: string[] = [];
  try {
    const match = data.choices?.[0]?.message?.content?.match(/\[.*\]/s);
    if (match) {
      names = JSON.parse(match[0]);
    }
  } catch {}
  // Map names to recipes
  const nameSet = new Set(names.map(n => n.toLowerCase()));
  let ordered = recipes.filter(r => r.name && nameSet.has(r.name.toLowerCase()));

  // Fill up with local recommendations if not enough, ensuring uniqueness by recipe ID
  if (ordered.length < maxResults) {
    const local = getPersonalizedRecipesLocal(user, recipes, maxResults);
    const seenIds = new Set(ordered.map(r => r.id));
    for (const r of local) {
      if (r.id && !seenIds.has(r.id)) {
        ordered.push(r);
        seenIds.add(r.id);
      }
      if (ordered.length >= maxResults) break;
    }
  }

  // Remove any accidental duplicates by ID or name (case-insensitive)
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueOrdered: Recipe[] = [];
  for (const r of ordered) {
    // More aggressive name normalization
    const nameKey = r.name ? r.name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '') : '';
    
    if (r.id && !seenIds.has(r.id)) {
      if (nameKey && !seenNames.has(nameKey)) {
        uniqueOrdered.push(r);
        seenIds.add(r.id);
        seenNames.add(nameKey);
      } else {
        // Debug: log skipped duplicates
        if (typeof console !== 'undefined') {
          // @ts-ignore
          console.log('Skipping duplicate recipe name:', { id: r.id, name: r.name, normalizedName: nameKey });
        }
      }
    }
    if (uniqueOrdered.length >= maxResults) break;
  }
  // Debug log for recommended recipes
  if (typeof console !== 'undefined') {
    // @ts-ignore
    console.log('Final unique recipes:', uniqueOrdered.map(r => ({ id: r.id, name: r.name })));
  }
  return uniqueOrdered;
}