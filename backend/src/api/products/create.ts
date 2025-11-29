import { FastifyInstance } from 'fastify';
import { ProductCreateRequest } from '../../validation/productSchemas';
import { ProductService } from '../../business/ProductService';
import { requirePermissions } from '../../middlewares/auth';
import { ZodError } from 'zod';

export function registerProductCreateRoute(app: FastifyInstance, productService: ProductService) {
  app.post(
    '/api/v1/products',
    {
      preHandler: [requirePermissions('PRODUCT_CREATE')],
    },
    async (request, reply) => {
      try {
        const input = ProductCreateRequest.parse(request.body);
        const user = (request as any).user;
        const product = await productService.create(user.sub, input);

        reply.code(201).send({ data: product });
      } catch (error) {
        if (error instanceof ZodError) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input',
              details: error.errors,
            },
          });
          return;
        }

        throw error;
      }
    }
  );
}
