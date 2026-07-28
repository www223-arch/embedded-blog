export const contentStatuses = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof contentStatuses)[number];

export const projectStages = ["concept", "building", "completed", "maintained", "paused"] as const;
export type ProjectStage = (typeof projectStages)[number];

export const projectPresentations = ["standard", "immersive"] as const;
export type ProjectPresentation = (typeof projectPresentations)[number];

export const projectNarratives = ["chronicle", "field-notes", "chapters"] as const;
export type ProjectNarrative = (typeof projectNarratives)[number];

export const projectVisualPresets = ["orbit", "signal", "archive"] as const;
export type ProjectVisualPreset = (typeof projectVisualPresets)[number];

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
