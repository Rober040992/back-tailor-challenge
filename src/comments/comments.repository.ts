import { Injectable } from "@nestjs/common";
import { Comment, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export class CommentRestaurantNotFoundError extends Error {}

@Injectable()
export class CommentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async restaurantExists(restaurantId: number): Promise<boolean> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });

    return restaurant !== null;
  }

  findByRestaurantId(restaurantId: number): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { restaurantId },
    });
  }

  findById(commentId: number): Promise<Comment | null> {
    return this.prisma.comment.findUnique({
      where: { id: commentId },
    });
  }

  async create(data: Prisma.CommentUncheckedCreateInput): Promise<Comment> {
    try {
      return await this.prisma.comment.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new CommentRestaurantNotFoundError();
      }

      throw error;
    }
  }

  update(commentId: number, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return this.prisma.comment.update({
      where: { id: commentId },
      data,
    });
  }

  async delete(commentId: number): Promise<boolean> {
    try {
      await this.prisma.comment.delete({
        where: { id: commentId },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return false;
      }

      throw error;
    }
  }
}
