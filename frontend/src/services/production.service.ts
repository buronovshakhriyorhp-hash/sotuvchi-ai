import axios from 'axios';
import { Recipe, Production } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const productionService = {
  // Recipes
  getRecipes: async () => {
    const res = await axios.get(`${API_URL}/production/recipes`);
    return res.data.data as Recipe[];
  },
  createRecipe: async (data: Partial<Recipe>) => {
    const res = await axios.post(`${API_URL}/production/recipes`, data);
    return res.data.data as Recipe;
  },

  // Production Execution
  getHistory: async (page = 1, limit = 50) => {
    const res = await axios.get(`${API_URL}/production/history`, { params: { page, limit } });
    return res.data.data as { productions: Production[], total: number };
  },
  executeProduction: async (data: { recipeId: number, quantity: number, warehouseId: number }) => {
    const res = await axios.post(`${API_URL}/production/execute`, data);
    return res.data.data as Production;
  }
};

export default productionService;
