import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
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

@Controller("auth")
export class AuthController {
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
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
  }
}
