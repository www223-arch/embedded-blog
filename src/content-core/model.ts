export const contentStatuses = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const projectStages = ["concept", "building", "completed", "maintained", "paused"] as const;
export type ProjectStage = (typeof projectStages)[number];

export type ContentVisibility = "preview" | "production";

export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && contentStatuses.includes(value as ContentStatus);
}

export function isProjectStage(value: unknown): value is ProjectStage {
  return typeof value === "string" && projectStages.includes(value as ProjectStage);
}

export function shouldIncludeContent(status: ContentStatus, visibility: ContentVisibility): boolean {
  if (status === "archived") return false;
  if (visibility === "production") return status === "published";
  return true;
}
