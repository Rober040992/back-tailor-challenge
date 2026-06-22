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
import {
  ApiBadRequestResponse,
  ApiCookieAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { logSafely } from "../common/logging/safe-logger";
import type { PublicUser } from "./auth.repository";
import { AuthService } from "./auth.service";
import { AuthUserResponseDto } from "./dto/auth-user-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RegisteredUserResponseDto } from "./dto/registered-user-response.dto";
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
@ApiTags("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Create a user account" })
  @ApiCreatedResponse({
    description: "The user account was created.",
    type: RegisteredUserResponseDto,
  })
  @ApiBadRequestResponse({ description: "The request body failed validation." })
  @ApiConflictResponse({ description: "The email or username already exists." })
  register(@Body() registerDto: RegisterDto): Promise<RegisteredUserResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Log in with a seeded user account" })
  @ApiOkResponse({
    description: "Authentication succeeded and the access_token cookie was set.",
    type: AuthUserResponseDto,
  })
  @ApiBadRequestResponse({ description: "The request body failed validation." })
  @ApiUnauthorizedResponse({ description: "The username or password is invalid." })
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
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOperation({ summary: "Log out and clear the authentication cookie" })
  @ApiNoContentResponse({ description: "The authentication cookie was cleared." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
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
