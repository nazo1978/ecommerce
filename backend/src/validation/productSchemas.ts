import { z } from 'zod';

export const ProductCreateRequest = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category: z.string(),
  images: z.array(z.string().url()).max(10),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED']).optional(),
});

export const ProductUpdateRequest = z.object({
  name: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  images: z.array(z.string().url()).max(10).optional(),
  featured: z.boolean().optional(),
});

export const ProductListQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
});

export type ProductCreateRequestDto = z.infer<typeof ProductCreateRequest>;
export type ProductUpdateRequestDto = z.infer<typeof ProductUpdateRequest>;
export type ProductListQueryDto = z.infer<typeof ProductListQuery>;
