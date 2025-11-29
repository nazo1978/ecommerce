import { z } from 'zod';

export const CheckoutRequest = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
  shippingInfo: z.object({
    address: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }),
  billingInfo: z
    .object({
      address: z.string(),
      city: z.string(),
      country: z.string(),
      postalCode: z.string(),
    })
    .optional(),
});

export type CheckoutRequestDto = z.infer<typeof CheckoutRequest>;
