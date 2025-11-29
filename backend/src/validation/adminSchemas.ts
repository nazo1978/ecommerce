import { z } from 'zod';

export const UpdateUserRoleRequest = z.object({
  roleCode: z.enum(['VISITOR', 'CUSTOMER', 'SELLER', 'ADMIN']),
});

export const ApproveSellerRequest = z.object({
  approved: z.boolean(),
  reason: z.string().optional(),
});

export const UserListQuery = z.object({
  q: z.string().optional(),
  role: z.string().optional(),
  emailVerified: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateUserRoleRequestDto = z.infer<typeof UpdateUserRoleRequest>;
export type ApproveSellerRequestDto = z.infer<typeof ApproveSellerRequest>;
export type UserListQueryDto = z.infer<typeof UserListQuery>;
