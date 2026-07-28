import type { ProjectItem } from "../../content/schema";
import { renderImmersiveProject } from "./immersive/view.ts";

export type ProjectExperienceKind = "standard" | "immersive";

export function selectProjectExperience(project: Pick<ProjectItem, "presentation">): ProjectExperienceKind {
  return project.presentation === "immersive" ? "immersive" : "standard";
}

export function renderProjectExperience(project: ProjectItem, renderStandard: (project: ProjectItem) => string): string {
  return selectProjectExperience(project) === "immersive" ? renderImmersiveProject(project) : renderStandard(project);
}
