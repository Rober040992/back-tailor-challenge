import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { logSafely } from "../common/logging/safe-logger";
import type { PublicUser } from "./auth.repository";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";

const ACCESS_TOKEN_COOKIE = "access_token";
const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const ACCESS_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  sameSite: "lax" as const,
  secure: false,
};

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ id: number; username: string }> {
    const result = await this.authService.login(loginDto);

    response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);

    return result.user;
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    logSafely(this.logger, "log", `[AUTH] logout userId=${request.user.id}`);
  }
}
