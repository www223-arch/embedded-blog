import { z } from "zod";

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const projectStageSchema = z.enum(["concept", "building", "completed", "maintained", "paused"]);
export const projectPresentationSchema = z.enum(["standard", "immersive"]);
export const projectNarrativeSchema = z.enum(["chronicle", "field-notes", "chapters"]);
export const projectVisualPresetSchema = z.enum(["orbit", "signal", "archive"]);

export const docSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  readingTime: z.string(),
  views: z.number(),
  summary: z.string(),
  status: contentStatusSchema,
  markdown: z.string()
});

export const projectSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  stack: z.array(z.string()),
  highlights: z.array(z.string()),
  gallery: z.array(z.string()),
  links: z.array(
    z.object({
      label: z.string(),
      href: z.string()
    })
  ),
  status: contentStatusSchema,
  projectStage: projectStageSchema,
  presentation: projectPresentationSchema.default("standard"),
  narrative: projectNarrativeSchema.default("chronicle"),
  visualPreset: projectVisualPresetSchema.default("orbit"),
  updatedAt: z.string().default(""),
  currentFocus: z.string().default(""),
  markdown: z.string().optional()
});

export type TechDoc = z.infer<typeof docSchema>;
export type ProjectItem = z.infer<typeof projectSchema>;
