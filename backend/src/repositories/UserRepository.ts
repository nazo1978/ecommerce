import { User, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  }

  async getRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    const roles = user?.userRoles.map((ur) => ur.role.code) || [];
    if (user?.primaryRole && !roles.includes(user.primaryRole)) {
      roles.push(user.primaryRole);
    }

    return roles;
  }

  async getPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    const permSet = new Set<string>();

    // Primary role permissions
    const primaryRole = await prisma.role.findUnique({
      where: { code: user?.primaryRole },
      include: {
        rolePermissions: { include: { permission: true } },
      },
    });
    primaryRole?.rolePermissions.forEach((rp) => permSet.add(rp.permission.code));

    // Additional roles permissions
    user?.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permSet.add(rp.permission.code);
      });
    });

    return Array.from(permSet);
  }
}
