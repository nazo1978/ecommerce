import { FastifyInstance } from 'fastify';
import { ProductService } from '../../business/ProductService';
import { requirePermissions } from '../../middlewares/auth';

export function registerProductApproveRoute(app: FastifyInstance, productService: ProductService) {
  app.post(
    '/api/v1/products/:id/approve',
    {
      preHandler: [requirePermissions('PRODUCT_APPROVE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const product = await productService.approve(id);
        reply.send({ data: product });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'PRODUCT_NOT_FOUND') {
            reply.code(404).send({
              error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
            });
            return;
          }
          if (error.message === 'PRODUCT_NOT_PENDING') {
            reply.code(400).send({
              error: { code: 'PRODUCT_NOT_PENDING', message: 'Product is not in pending status' },
            });
            return;
          }
        }
        throw error;
      }
    }
  );
}
