import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt";
import { logSafely } from "../common/logging/safe-logger";
import { AuthRepository, PublicUser } from "./auth.repository";
import { LoginDto } from "./dto/login.dto";

const INVALID_CREDENTIALS_MESSAGE = "Invalid username or password.";

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
