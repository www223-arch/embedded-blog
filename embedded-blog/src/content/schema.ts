import { z } from "zod";

export const docSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  updatedAt: z.string(),
  summary: z.string(),
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
  )
});

export type TechDoc = z.infer<typeof docSchema>;
export type ProjectItem = z.infer<typeof projectSchema>;
