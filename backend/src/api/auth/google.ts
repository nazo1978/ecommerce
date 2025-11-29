import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../config/prisma';
import { generateTokens } from '../../utils/jwt';
import { assignDefaultPermissions } from '../../utils/rbac';

export const googleAuthHandler = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { credential } = request.body as { credential: string };

    // Decode Google JWT (in production, verify with Google's public keys)
    const payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());

    const { email, given_name, family_name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user with Google account
      user = await prisma.user.create({
        data: {
          email,
          password: '', // No password for OAuth users
          firstName: given_name || 'User',
          lastName: family_name || '',
          emailVerified: true, // Google emails are verified
          primaryRole: 'CUSTOMER',
          avatar: picture,
        },
      });

      // Assign default permissions
      await assignDefaultPermissions(user.id, 'CUSTOMER');
    }

    // Generate tokens
    const tokens = generateTokens({ userId: user.id });

    // Return user data and tokens
    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          primaryRole: user.primaryRole,
          avatar: user.avatar,
        },
        tokens,
      },
    });
  } catch (error: any) {
    request.log.error('Google auth error', error);
    return reply.code(401).send({
      error: {
        code: 'GOOGLE_AUTH_FAILED',
        message: 'Google authentication failed',
      },
    });
  }
};
