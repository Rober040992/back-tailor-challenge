import { ConflictException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare, hash } from "bcrypt";
import { logSafely } from "../common/logging/safe-logger";
import {
  AuthRepository,
  DuplicateRegistrationError,
  PublicUser,
  RegisteredUser,
} from "./auth.repository";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password.";
const DUPLICATE_REGISTRATION_MESSAGE = "Email or username already exists.";
const BCRYPT_SALT_ROUNDS = 10;

export interface LoginResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<RegisteredUser> {
    const passwordHash = await hash(registerDto.password, BCRYPT_SALT_ROUNDS);

    try {
      const user = await this.authRepository.create(
        registerDto.email,
        registerDto.username,
        passwordHash,
      );

      logSafely(
        this.logger,
        "log",
        `[AUTH] registration success userId=${user.id} username=${user.username}`,
      );

      return user;
    } catch (error) {
      if (error instanceof DuplicateRegistrationError) {
        throw new ConflictException(DUPLICATE_REGISTRATION_MESSAGE);
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const user = await this.authRepository.findByUsername(loginDto.username);

    if (!user) {
      logSafely(this.logger, "warn", `[AUTH] login failed username=${loginDto.username}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      logSafely(this.logger, "warn", `[AUTH] login failed username=${loginDto.username}`);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const publicUser: PublicUser = {
      id: user.id,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync({
      sub: publicUser.id,
      username: publicUser.username,
    });

    logSafely(
      this.logger,
      "log",
      `[AUTH] login success userId=${publicUser.id} username=${publicUser.username}`,
    );

    return {
      accessToken,
      user: publicUser,
    };
  }
}
