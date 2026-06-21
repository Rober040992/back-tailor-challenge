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
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt/jwt-auth.guard";
import { CreateRestaurantDto } from "./dto/create-restaurant.dto";
import { UpdateRestaurantDto } from "./dto/update-restaurant.dto";
import { RestaurantResponse, RestaurantsService } from "./restaurants.service";

@Controller("restaurants")
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  findAll(): Promise<RestaurantResponse[]> {
    return this.restaurantsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number): Promise<RestaurantResponse> {
    return this.restaurantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRestaurantDto: CreateRestaurantDto): Promise<RestaurantResponse> {
    return this.restaurantsService.create(createRestaurantDto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<RestaurantResponse> {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.restaurantsService.delete(id);
  }
}
