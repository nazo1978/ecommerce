export interface Repository<T, TId = string> {
  findById(id: TId): Promise<T | null>;
  findMany(params?: unknown): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: TId, data: Partial<T>): Promise<T>;
  delete(id: TId): Promise<void>;
}
