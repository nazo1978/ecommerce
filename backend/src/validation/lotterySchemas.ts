import { z } from 'zod';

export const CreateLotteryRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  ticketPrice: z.number().positive(),
  maxTickets: z.number().int().positive().optional(),
  drawDate: z.string().datetime(),
  prizePool: z.number().positive(),
});

export const BuyTicketRequest = z.object({
  quantity: z.number().int().min(1).max(100),
});

export type CreateLotteryRequestDto = z.infer<typeof CreateLotteryRequest>;
export type BuyTicketRequestDto = z.infer<typeof BuyTicketRequest>;
