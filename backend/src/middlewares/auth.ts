import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenService } from '../core/TokenService';

export function createAuthMiddleware(tokenService: TokenService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = await tokenService.verifyAccessToken(token);
      // Map token payload to request.user format
      (request as any).user = {
        userId: payload.sub,
        roles: payload.roles,
        permissions: payload.permissions,
      };
    } catch (error) {
      reply.code(401).send({ error: { code: 'INVALID_TOKEN', message: 'Token is invalid or expired' } });
    }
  };
}

export function requirePermissions(...permissions: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    if (!user) {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    if (!user.permissions || !Array.isArray(user.permissions)) {
      reply.code(403).send({ 
        error: { 
          code: 'FORBIDDEN', 
          message: 'No permissions found' 
        } 
      });
      return;
    }

    const hasPermission = permissions.every((perm) => user.permissions.includes(perm));

    if (!hasPermission) {
      reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          required: permissions,
          has: user.permissions,
        },
      });
      return;
    }
  };
}

export function requireRoles(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;

    if (!user) {
      reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const hasRole = roles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      reply.code(403).send({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role',
          required: roles,
        },
      });
    }
  };
}
