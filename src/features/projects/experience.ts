import type { ProjectItem } from "../../content/schema";

export type ProjectExperienceKind = "standard" | "immersive";

export function selectProjectExperience(project: Pick<ProjectItem, "presentation">): ProjectExperienceKind {
  return project.presentation === "immersive" ? "immersive" : "standard";
}
