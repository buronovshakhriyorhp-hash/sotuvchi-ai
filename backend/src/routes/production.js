const productionService = require('../services/production.service');
const { sendSuccess, sendError } = require('../services/response.utility');

async function productionRoutes(fastify) {
  // --- Recipes ---

  // GET /api/production/recipes
  fastify.get('/recipes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const recipes = await productionService.getRecipes(request.user.businessId);
    return sendSuccess(reply, recipes);
  });

  // POST /api/production/recipes
  fastify.post('/recipes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const recipe = await productionService.createRecipe(request.body, request.user.businessId);
      return sendSuccess(reply, recipe, 201);
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });

  // --- Production ---

  // POST /api/production/execute
  fastify.post('/execute', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { recipeId, quantity, warehouseId } = request.body;
    if (!recipeId || !quantity || !warehouseId) {
      return sendError(reply, 'Hamma maydonlar to\'ldirilishi shart', 400);
    }

    try {
      const result = await productionService.executeProduction({
        recipeId,
        quantity,
        warehouseId,
        businessId: request.user.businessId,
        userId: request.user.id
      });
      return sendSuccess(reply, result, 201);
    } catch (error) {
      return sendError(reply, error.message, 400);
    }
  });

  // GET /api/production/history
  fastify.get('/history', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { page = 1, limit = 50 } = request.query;
    const result = await productionService.getProductionHistory(page, limit, request.user.businessId);
    return sendSuccess(reply, result);
  });
}

module.exports = productionRoutes;
