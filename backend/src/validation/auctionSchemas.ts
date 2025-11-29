import { z } from 'zod';

export const CreateAuctionRequest = z.object({
  productId: z.string(),
  startPrice: z.number().positive(),
  buyNowPrice: z.number().positive().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  autoExtend: z.boolean().default(true),
});

export const PlaceBidRequest = z.object({
  amount: z.number().positive(),
  isAutoBid: z.boolean().default(false),
  maxAutoBid: z.number().positive().optional(),
});

export type CreateAuctionRequestDto = z.infer<typeof CreateAuctionRequest>;
export type PlaceBidRequestDto = z.infer<typeof PlaceBidRequest>;
