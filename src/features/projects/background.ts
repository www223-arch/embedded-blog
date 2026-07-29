import type { ProjectItem } from "../../content/schema.ts";

type ProjectBackgroundFields = Pick<ProjectItem, "backgroundImage" | "backgroundPosition" | "backgroundTone">;

export type ProjectBackgroundConfig = {
  light: string;
  dark: string;
  className: string;
};

export function getProjectBackgroundConfig(project: ProjectBackgroundFields, baseUrl: string): ProjectBackgroundConfig {
  const base = normalizeBase(baseUrl);
  const fallback = {
    light: `${base}xiangmuzuopingbaitian.jpg`,
    dark: `${base}xiangmuzuopingheitian.jpg`,
    className: ""
  };
  const image = resolveAssetPath(project.backgroundImage, base);
  if (!image) return fallback;

  return {
    light: image,
    dark: image,
    className: [
      "project-background-custom",
      `project-background-${project.backgroundPosition}`,
      `project-background-${project.backgroundTone}`
    ].join(" ")
  };
}

function normalizeBase(value: string): string {
  return `${value || "/"}`.replace(/\/?$/, "/");
}

function resolveAssetPath(value: string, base: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("//") || /^javascript:/i.test(trimmed)) return "";
  if (!trimmed.startsWith("/")) return trimmed;
  if (base === "/" || trimmed.startsWith(base)) return trimmed;
  return `${base.replace(/\/$/, "")}${trimmed}`;
}
