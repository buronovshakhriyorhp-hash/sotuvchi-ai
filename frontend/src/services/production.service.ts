import api from '../api/axios';
import { Recipe, Production } from '../types';

const productionService = {
  // Recipes
  getRecipes: async () => {
    const res = await api.get('/production/recipes');
    return res as unknown as Recipe[];
  },
  createRecipe: async (data: Partial<Recipe>) => {
    const res = await api.post('/production/recipes', data);
    return res as unknown as Recipe;
  },

  // Production Execution
  getHistory: async (page = 1, limit = 50) => {
    const res = await api.get('/production/history', { params: { page, limit } });
    return res as unknown as { productions: Production[], total: number };
  },
  executeProduction: async (data: { recipeId: number, quantity: number, warehouseId: number }) => {
    const res = await api.post('/production/execute', data);
    return res as unknown as Production;
  }
};

export default productionService;
