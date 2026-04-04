import { projectSchema, type ProjectItem } from "./schema";

const projectsRaw = [
] as const;

export const projectItems: ProjectItem[] = projectsRaw.map((item) => projectSchema.parse(item));
