import type { ProjectItem } from "../../../content/schema.ts";

export type ImmersiveSceneModuleKey = "signal" | "motor-lab";

export function getSceneModuleKey(preset: ProjectItem["visualPreset"]): ImmersiveSceneModuleKey {
  return preset === "motor-lab" ? "motor-lab" : "signal";
}
