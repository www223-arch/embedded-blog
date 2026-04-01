import { docSchema, type TechDoc } from "./schema";

const docsRaw = [
] as const;

export const techDocs: TechDoc[] = docsRaw.map((item) => docSchema.parse(item));
