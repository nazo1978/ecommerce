import { ProductCreateRequestDto, ProductUpdateRequestDto, ProductListQueryDto } from '../validation/productSchemas';
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductStatus } from '../types/enums';

export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async create(sellerId: string, input: ProductCreateRequestDto) {
    const product = await this.productRepository.create({
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,
      category: input.category,
      images: input.images,
      status: 'PENDING',
      seller: {
        connect: { id: sellerId },
      },
    });

    return product;
  }

  async list(query: ProductListQueryDto) {
    const { data, total } = await this.productRepository.findMany({
      q: query.q,
      category: query.category,
      priceMin: query.priceMin,
      priceMax: query.priceMax,
      status: query.status as ProductStatus,
      page: query.page,
      limit: query.limit,
    });

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async update(id: string, sellerId: string, input: ProductUpdateRequestDto) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.sellerId !== sellerId) {
      throw new Error('FORBIDDEN');
    }

    return this.productRepository.update(id, input);
  }

  async approve(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.status !== 'PENDING') {
      throw new Error('PRODUCT_NOT_PENDING');
    }

    return this.productRepository.update(id, {
      status: 'APPROVED',
    });
  }

  async publish(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (product.status !== 'APPROVED') {
      throw new Error('PRODUCT_NOT_APPROVED');
    }

    return this.productRepository.update(id, {
      status: 'PUBLISHED',
    });
  }

  async reject(id: string, reason?: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    return this.productRepository.update(id, {
      status: 'REJECTED',
    });
  }

  // Admin methods
  async adminUpdate(id: string, input: any) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    return this.productRepository.update(id, input);
  }

  async delete(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    return this.productRepository.delete(id);
  }
}
