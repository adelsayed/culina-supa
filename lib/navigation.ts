import { router } from 'expo-router';

export const navigateToRecipe = (id: string) => {
  router.push(`/recipes/${id}`);
};
