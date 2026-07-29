import { z } from "zod";

export const contentStatusSchema = z.enum(["draft", "published", "archived"]);
export const projectStageSchema = z.enum(["concept", "building", "completed", "maintained", "paused"]);
export const projectPresentationSchema = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.enum(["standard", "immersive"]).default("standard")
);
export const projectNarrativeSchema = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.enum(["chronicle", "field-notes", "chapters"]).default("chronicle")
);
export const projectVisualPresetSchema = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.enum(["orbit", "signal", "archive", "motor-lab"]).default("orbit")
);
export const projectBackgroundPositionSchema = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.enum(["center", "top", "bottom", "left", "right"]).default("center")
);
export const projectBackgroundToneSchema = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.enum(["soft", "balanced", "strong"]).default("balanced")
);
export const narrativeBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("milestone"),
    date: z.string(),
    title: z.string(),
    status: z.enum(["past", "current", "future"]),
    media: z.string(),
    document: z.string().optional(),
    body: z.string()
  }),
  z.object({
    type: z.literal("question"),
    title: z.string(),
    state: z.enum(["open", "resolved"]),
    body: z.string()
  }),
  z.object({
    type: z.literal("next"),
    title: z.string(),
    body: z.string()
  })
]);

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
  presentation: projectPresentationSchema,
  narrative: projectNarrativeSchema,
  visualPreset: projectVisualPresetSchema,
  backgroundImage: z.string().default(""),
  backgroundPosition: projectBackgroundPositionSchema,
  backgroundTone: projectBackgroundToneSchema,
  updatedAt: z.string().default(""),
  currentFocus: z.string().default(""),
  narrativeBlocks: z.array(narrativeBlockSchema).default([]),
  markdown: z.string().optional()
});

export type TechDoc = z.infer<typeof docSchema>;
export type ProjectItem = z.infer<typeof projectSchema>;
