export const ATTACHMENT_BUCKET = "attachments";

export const POST_LIMITS = {
  body: 5000,
  feedbackQuestion: 300,
  attachments: 10,
} as const;

/** Longest edge of an uploaded photo, and of its feed preview. */
export const PHOTO_MAX_EDGE = 1600;
export const PHOTO_PREVIEW_EDGE = 800;

/** Folder a user's uploads for a project must live in (enforced by storage policy). */
export function attachmentFolder(projectId: string, userId: string): string {
  return `${projectId}/${userId}/`;
}
