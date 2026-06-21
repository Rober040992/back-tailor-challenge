import { ApiProperty } from "@nestjs/swagger";

export class CommentResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 1 })
  restaurantId!: number;

  @ApiProperty({ example: "roberto" })
  name!: string;

  @ApiProperty({ example: "2026-06-21" })
  date!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  rating!: number;

  @ApiProperty({ example: "Excellent food and service." })
  body!: string;

  @ApiProperty({ type: String, format: "date-time" })
  createdAt!: Date;

  @ApiProperty({ type: String, format: "date-time" })
  updatedAt!: Date;
}

export class CommentsResponse {
  @ApiProperty({ type: [CommentResponse] })
  results!: CommentResponse[];
}
