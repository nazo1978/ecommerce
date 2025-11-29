// Enum replacement types for SQLite compatibility

export type UserRoleEnum = 'VISITOR' | 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type ProductStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | 'REJECTED' | 'OUT_OF_STOCK';
export type AuctionStatus = 'SCHEDULED' | 'RUNNING' | 'ENDED' | 'CANCELLED';
export type LotteryStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type OrderStatus = 'CART' | 'PENDING_PAYMENT' | 'PAID' | 'FULFILLING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'INITIATED' | 'AUTHORIZED' | 'CAPTURED' | 'REFUNDED' | 'FAILED' | 'CHARGEBACK';
