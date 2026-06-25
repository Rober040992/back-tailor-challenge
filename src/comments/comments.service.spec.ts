import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ForbiddenException } from "@nestjs/common";
import { Comment } from "@prisma/client";
import { CommentsRepository } from "./comments.repository";
import { CommentsService } from "./comments.service";

function createComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    userId: 1,
    restaurantId: 1,
    name: "roberto",
    date: "2026-06-21",
    rating: 4,
    body: "Great food.",
    createdAt: new Date("2026-06-21T10:00:00.000Z"),
    updatedAt: new Date("2026-06-21T10:00:00.000Z"),
    ...overrides,
  };
}

describe("CommentsService", () => {
  let commentsService: CommentsService;
  let commentsRepository: {
    restaurantExists: jest.MockedFunction<CommentsRepository["restaurantExists"]>;
    findByRestaurantId: jest.MockedFunction<CommentsRepository["findByRestaurantId"]>;
    findById: jest.MockedFunction<CommentsRepository["findById"]>;
    create: jest.MockedFunction<CommentsRepository["create"]>;
    update: jest.MockedFunction<CommentsRepository["update"]>;
    delete: jest.MockedFunction<CommentsRepository["delete"]>;
  };

  beforeEach(() => {
    commentsRepository = {
      restaurantExists: jest.fn(),
      findByRestaurantId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    commentsService = new CommentsService(commentsRepository as unknown as CommentsRepository);
  });

  it("creates a comment with server-generated author data", async () => {
    const comment = createComment();
    commentsRepository.restaurantExists.mockResolvedValue(true);
    commentsRepository.create.mockResolvedValue(comment);

    await expect(
      commentsService.create({ id: 1, username: "roberto" }, 1, { rating: 4, body: "Great food." }),
    ).resolves.toEqual(comment);
    expect(commentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        restaurantId: 1,
        name: "roberto",
        rating: 4,
        body: "Great food.",
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      }),
    );
  });

  it("allows the author to update a comment", async () => {
    const updatedComment = createComment({ rating: 5 });
    commentsRepository.findById.mockResolvedValue(createComment());
    commentsRepository.update.mockResolvedValue(updatedComment);

    await expect(commentsService.update(1, 1, { rating: 5 })).resolves.toEqual(updatedComment);
    expect(commentsRepository.update).toHaveBeenCalledWith(1, { rating: 5 });
  });

  it("rejects an update by another authenticated user", async () => {
    commentsRepository.findById.mockResolvedValue(createComment({ userId: 2 }));

    await expect(commentsService.update(1, 1, { rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(commentsRepository.update).not.toHaveBeenCalled();
  });

  it("allows the author to delete a comment", async () => {
    commentsRepository.findById.mockResolvedValue(createComment());
    commentsRepository.delete.mockResolvedValue(true);

    await expect(commentsService.delete(1, 1)).resolves.toBeUndefined();
  });

  it("rejects deletion by another authenticated user", async () => {
    commentsRepository.findById.mockResolvedValue(createComment({ userId: 2 }));

    await expect(commentsService.delete(1, 1)).rejects.toBeInstanceOf(ForbiddenException);
    expect(commentsRepository.delete).not.toHaveBeenCalled();
  });
});
