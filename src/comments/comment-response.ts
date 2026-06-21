import { Comment } from "@prisma/client";

export type CommentResponse = Comment;

export interface CommentsResponse {
  results: CommentResponse[];
}
