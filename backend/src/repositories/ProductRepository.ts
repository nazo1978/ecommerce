import { Product, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ProductStatus } from '../types/enums';

export class ProductRepository {
  async findById(id: string): Promise<Product | null> {
    return prisma.product.findUnique({ where: { id } });
  }

  async findMany(params: {
    q?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    status?: ProductStatus;
    page: number;
    limit: number;
  }): Promise<{ data: Product[]; total: number }> {
    const { q, category, priceMin, priceMax, status, page, limit } = params;

    const where: Prisma.ProductWhereInput = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { data, total };
  }

  async create(data: any) {
    // Convert images array to JSON string if it's an array
    const productData = {
      ...data,
      images: Array.isArray(data.images) ? JSON.stringify(data.images) : data.images,
    };
    return prisma.product.create({ data: productData });
  }

  async update(id: string, data: any) {
    // Convert images array to JSON string if it's an array
    const productData = {
      ...data,
      images: Array.isArray(data.images) ? JSON.stringify(data.images) : data.images,
    };
    return prisma.product.update({ where: { id }, data: productData });
  }

  async delete(id: string): Promise<void> {
    await prisma.product.delete({ where: { id } });
  }
}
