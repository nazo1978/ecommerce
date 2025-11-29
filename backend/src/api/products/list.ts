import { FastifyInstance } from 'fastify';
import { ProductListQuery } from '../../validation/productSchemas';
import { ProductService } from '../../business/ProductService';

export function registerProductListRoute(app: FastifyInstance, productService: ProductService) {
  app.get('/api/v1/products', async (request, reply) => {
    const query = ProductListQuery.parse(request.query);
    const result = await productService.list(query);

    reply.send(result);
  });
}
