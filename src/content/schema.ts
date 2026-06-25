import { z } from "zod";

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const projectStageSchema = z.enum(["concept", "building", "completed", "maintained", "paused"]);

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
  markdown: z.string().optional()
});

export type TechDoc = z.infer<typeof docSchema>;
export type ProjectItem = z.infer<typeof projectSchema>;
