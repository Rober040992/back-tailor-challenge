import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import type { Request } from "express";
import type { PublicUser } from "../auth/auth.repository";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantResponse } from "./restaurant-response";
import { RestaurantsService } from "./restaurants.service";

interface AuthenticatedRequest extends Request {
  user: PublicUser;
}

@Controller("restaurants")
@ApiTags("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: "List restaurants" })
  @ApiOkResponse({ description: "Restaurants returned successfully.", type: [RestaurantResponse] })
  findAll(): Promise<RestaurantResponse[]> {
    return this.restaurantsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a restaurant by ID" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiOkResponse({ description: "Restaurant returned successfully.", type: RestaurantResponse })
  @ApiBadRequestResponse({ description: "The restaurant ID is invalid." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  findOne(@Param("id", ParseIntPipe) id: number): Promise<RestaurantResponse> {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Create a restaurant" })
  @ApiCreatedResponse({ description: "Restaurant created successfully.", type: RestaurantResponse })
  @ApiBadRequestResponse({ description: "The request body failed validation." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  create(
    @Req() request: AuthenticatedRequest,
    @Body() createRestaurantDto: CreateRestaurantDto,
  ): Promise<RestaurantResponse> {
    return this.restaurantsService.create(request.user.id, createRestaurantDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Update a restaurant" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiOkResponse({ description: "Restaurant updated successfully.", type: RestaurantResponse })
  @ApiBadRequestResponse({ description: "The ID or request body failed validation." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  update(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<RestaurantResponse> {
    return this.restaurantsService.update(request.user.id, id, updateRestaurantDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth("access_token")
  @ApiOperation({ summary: "Delete a restaurant" })
  @ApiParam({ name: "id", type: Number, example: 1 })
  @ApiNoContentResponse({ description: "Restaurant deleted successfully." })
  @ApiBadRequestResponse({ description: "The restaurant ID is invalid." })
  @ApiUnauthorizedResponse({ description: "Authentication is required." })
  @ApiNotFoundResponse({ description: "The restaurant does not exist." })
  @ApiConflictResponse({ description: "The restaurant has related records." })
  delete(
    @Req() request: AuthenticatedRequest,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    return this.restaurantsService.delete(request.user.id, id);
  }
}
