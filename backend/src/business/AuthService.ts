import { RegisterRequestDto, LoginRequestDto } from '../validation/authSchemas';
import { UserRepository } from '../repositories/UserRepository';
import { Hasher } from '../core/Hasher';
import { TokenService } from '../core/TokenService';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hasher: Hasher,
    private readonly tokenService: TokenService
  ) {}

  async register(input: RegisterRequestDto) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.userRepository.create({
      email: input.email,
      password: passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      primaryRole: 'CUSTOMER',
      twoFactorEnabled: input.twoFactorEnabled || false,
    });

    const roles = await this.userRepository.getRoles(user.id);
    const permissions = await this.userRepository.getPermissions(user.id);

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      roles,
      permissions,
    });

    return { user, tokens };
  }

  async login(input: LoginRequestDto) {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !user.password) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.hasher.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // TODO: 2FA kontrolü (user.twoFactorEnabled && input.totp)
    // TODO: Account lockout kontrolü

    const roles = await this.userRepository.getRoles(user.id);
    const permissions = await this.userRepository.getPermissions(user.id);

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      roles,
      permissions,
    });

    return { user, tokens };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const roles = await this.userRepository.getRoles(user.id);
    const permissions = await this.userRepository.getPermissions(user.id);

    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      roles,
      permissions,
    });

    return { tokens };
  }

  async loginOrCreateWithGoogle(data: {
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  }) {
    // Find or create user
    let user = await this.userRepository.findByEmail(data.email);

    if (!user) {
      // Create new user with Google OAuth
      user = await this.userRepository.create({
        email: data.email,
        password: '', // No password for OAuth users
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerified: true,
        primaryRole: 'CUSTOMER',
        avatar: data.avatar,
      });
    }

    // Get user roles and permissions
    const roles = await this.userRepository.getRoles(user.id);
    const permissions = await this.userRepository.getPermissions(user.id);

    // Generate tokens
    const tokens = await this.tokenService.generateTokens({
      sub: user.id,
      roles,
      permissions,
    });

    return { user, tokens };
  }
}
