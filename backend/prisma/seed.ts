import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Roller oluştur
  const visitorRole = await prisma.role.upsert({
    where: { code: 'VISITOR' },
    update: {},
    create: { code: 'VISITOR', name: 'Visitor' },
  });

  const customerRole = await prisma.role.upsert({
    where: { code: 'CUSTOMER' },
    update: {},
    create: { code: 'CUSTOMER', name: 'Customer' },
  });

  const sellerRole = await prisma.role.upsert({
    where: { code: 'SELLER' },
    update: {},
    create: { code: 'SELLER', name: 'Seller' },
  });

  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'Administrator' },
  });

  // İzinler oluştur
  const permissions = [
    { code: 'PRODUCT_VIEW', name: 'View Products' },
    { code: 'CART_USE', name: 'Use Shopping Cart' },
    { code: 'ORDER_CREATE', name: 'Create Orders' },
    { code: 'PAYMENT_USE', name: 'Use Payment' },
    { code: 'AUCTION_BID', name: 'Bid on Auctions' },
    { code: 'LOTTERY_TICKET_BUY', name: 'Buy Lottery Tickets' },
    { code: 'MLM_PARTICIPATE', name: 'Participate in MLM' },
    { code: 'PRODUCT_CREATE', name: 'Create Products' },
    { code: 'PRODUCT_UPDATE', name: 'Update Products' },
    { code: 'PRODUCT_MANAGE', name: 'Manage Products' },
    { code: 'INVENTORY_MANAGE', name: 'Manage Inventory' },
    { code: 'AUCTION_CREATE', name: 'Create Auctions' },
    { code: 'AUCTION_MANAGE', name: 'Manage Auctions' },
    { code: 'LOTTERY_CREATE', name: 'Create Lottery' },
    { code: 'LOTTERY_MANAGE', name: 'Manage Lottery' },
    { code: 'ORDER_FULFILL', name: 'Fulfill Orders' },
    { code: 'ADMIN_READ', name: 'Admin Read Access' },
    { code: 'ADMIN_WRITE', name: 'Admin Write Access' },
    { code: 'USER_MANAGE', name: 'Manage Users' },
    { code: 'SELLER_APPROVE', name: 'Approve Sellers' },
    { code: 'PRODUCT_APPROVE', name: 'Approve Products' },
    { code: 'REPORT_VIEW', name: 'View Reports' },
    { code: 'SYSTEM_CONFIG', name: 'System Configuration' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  // Rol-İzin eşleştirmeleri
  const rolePermissionMap = {
    VISITOR: ['PRODUCT_VIEW'],
    CUSTOMER: [
      'PRODUCT_VIEW',
      'CART_USE',
      'ORDER_CREATE',
      'PAYMENT_USE',
      'AUCTION_BID',
      'LOTTERY_TICKET_BUY',
      'MLM_PARTICIPATE',
    ],
    SELLER: [
      'PRODUCT_VIEW',
      'PRODUCT_CREATE',
      'PRODUCT_UPDATE',
      'INVENTORY_MANAGE',
      'AUCTION_CREATE',
      'LOTTERY_CREATE',
      'ORDER_FULFILL',
    ],
    ADMIN: permissions.map((p) => p.code),
  };

  for (const [roleCode, permCodes] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (!role) continue;

    for (const permCode of permCodes) {
      const perm = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!perm) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }
  }

  // Create demo users
  console.log('Creating demo users...');
  
  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ecommerce.com' },
    update: {},
    create: {
      email: 'admin@ecommerce.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      primaryRole: 'ADMIN',
      emailVerified: true,
      twoFactorEnabled: false,
    },
  });
  
  // Vendor/Seller user
  const vendorUser = await prisma.user.upsert({
    where: { email: 'vendor@ecommerce.com' },
    update: {},
    create: {
      email: 'vendor@ecommerce.com',
      password: hashedPassword,
      firstName: 'Vendor',
      lastName: 'Shop',
      primaryRole: 'SELLER',
      emailVerified: true,
      twoFactorEnabled: false,
    },
  });
  
  // Customer user
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@ecommerce.com' },
    update: {},
    create: {
      email: 'customer@ecommerce.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      primaryRole: 'CUSTOMER',
      emailVerified: true,
      twoFactorEnabled: false,
    },
  });
  
  console.log('Demo users created:');
  console.log('  Admin: admin@ecommerce.com / password123');
  console.log('  Vendor: vendor@ecommerce.com / password123');
  console.log('  Customer: customer@ecommerce.com / password123');
  
  // Create wallet for users
  await prisma.wallet.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      balance: 10000,
      currency: 'TRY',
    },
  });
  
  await prisma.wallet.upsert({
    where: { userId: vendorUser.id },
    update: {},
    create: {
      userId: vendorUser.id,
      balance: 5000,
      currency: 'TRY',
    },
  });
  
  await prisma.wallet.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      balance: 1000,
      currency: 'TRY',
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
