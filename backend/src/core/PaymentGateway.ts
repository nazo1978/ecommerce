export interface PaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  provider: string;
  providerRef: string;
  status: 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
}

export interface PaymentGateway {
  authorize(req: PaymentRequest): Promise<PaymentResult>;
  capture(providerRef: string): Promise<PaymentResult>;
  refund(providerRef: string, amount?: number): Promise<PaymentResult>;
}
