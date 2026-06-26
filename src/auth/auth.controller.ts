import {
  Body,
  Controller,
  Get,
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
import { CurrentUserResponseDto } from "./dto/current-user-response.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { RegisteredUserResponseDto } from "./dto/registered-user-response.dto";
import { JwtAuthGuard } from "./jwt/jwt-auth.guard";

const ACCESS_TOKEN_COOKIE = "access_token";
const ACCESS_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getAccessTokenCookieSecurityOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
  };
}

function getAccessTokenCookieOptions() {
  return {
    httpOnly: true,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
    ...getAccessTokenCookieSecurityOptions(),
  };
}

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

    response.cookie(ACCESS_TOKEN_COOKIE, result.accessToken, getAccessTokenCookieOptions());

    return result.user;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(ACCESS_TOKEN_COOKIE)
  @ApiOperation({ summary: "Get the current authenticated user" })
  @ApiOkResponse({
    description: "The current authenticated user was returned.",
    type: CurrentUserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  getCurrentUser(@Req() request: AuthenticatedRequest): Promise<CurrentUserResponseDto> {
    return this.authService.getCurrentUser(request.user.id);
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
      ...getAccessTokenCookieSecurityOptions(),
    });
    logSafely(this.logger, "log", `[AUTH] logout userId=${request.user.id}`);
  }
}
