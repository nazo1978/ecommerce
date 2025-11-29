import { FastifyInstance } from 'fastify';
import { ProductService } from '../../business/ProductService';
import { requirePermissions } from '../../middlewares/auth';

export function registerAdminProductRoutes(app: FastifyInstance, productService: ProductService) {
  // List all products (admin view)
  app.get(
    '/api/v1/admin/products',
    {
      preHandler: [requirePermissions('PRODUCT_MANAGE')],
    },
    async (request, reply) => {
      const query = request.query as any;
      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '20');
      const category = query.category;
      const status = query.status;
      const search = query.q;

      const result = await productService.list({
        page,
        limit,
        category,
        status,
        q: search,
      });

      reply.send({ data: result });
    }
  );

  // Get product details
  app.get(
    '/api/v1/admin/products/:id',
    {
      preHandler: [requirePermissions('PRODUCT_MANAGE')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const product = await productService.getById(id);
        reply.send({ data: product });
      } catch (error) {
        if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
          });
          return;
        }
        throw error;
      }
    }
  );

  // Create product (admin)
  app.post(
    '/api/v1/admin/products',
    {
      preHandler: [requirePermissions('PRODUCT_MANAGE')],
    },
    async (request, reply) => {
      try {
        const userId = (request as any).user.userId;
        const input = request.body as any;

        // Validate required fields
        if (!input.name || !input.description || input.price === undefined || input.stock === undefined || !input.category) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Missing required fields: name, description, price, stock, category',
            },
          });
          return;
        }

        // Validate price and stock
        if (input.price < 0) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Price must be greater than or equal to 0',
            },
          });
          return;
        }

        if (input.stock < 0) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Stock must be greater than or equal to 0',
            },
          });
          return;
        }

        // Validate name and description length
        if (input.name.length < 3) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Name must be at least 3 characters',
            },
          });
          return;
        }

        if (input.description.length < 10) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Description must be at least 10 characters',
            },
          });
          return;
        }

        if (!input.category || input.category.trim() === '') {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Category cannot be empty',
            },
          });
          return;
        }

        const product = await productService.create(userId, input);

        reply.code(201).send({
          data: product,
          message: 'Product created successfully',
        });
      } catch (error: any) {
        reply.code(400).send({
          error: {
            code: 'CREATE_ERROR',
            message: error.message || 'Failed to create product',
          },
        });
      }
    }
  );

  // Update product
  app.patch(
    '/api/v1/admin/products/:id',
    {
      preHandler: [requirePermissions('PRODUCT_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = request.body as any;

        // Validate price if provided
        if (input.price !== undefined && input.price < 0) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Price must be greater than or equal to 0',
            },
          });
          return;
        }

        // Validate stock if provided
        if (input.stock !== undefined && input.stock < 0) {
          reply.code(400).send({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Stock must be greater than or equal to 0',
            },
          });
          return;
        }

        const product = await productService.adminUpdate(id, input);
        reply.send({
          data: product,
          message: 'Product updated successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
          });
          return;
        }
        throw error;
      }
    }
  );

  // Delete product
  app.delete(
    '/api/v1/admin/products/:id',
    {
      preHandler: [requirePermissions('PRODUCT_MANAGE')],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        await productService.delete(id);
        reply.send({
          message: 'Product deleted successfully',
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
          reply.code(404).send({
            error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
          });
          return;
        }
        throw error;
      }
    }
  );
}
