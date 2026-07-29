import type { ProjectItem } from "../../../content/schema.ts";
import type { ImmersiveSceneController, ProjectChapter } from "./types.ts";

export type ImmersiveSceneModuleKey = "signal" | "motor-lab";
export type ImmersiveSceneMount = (
  host: HTMLElement,
  chapters: ProjectChapter[]
) => ImmersiveSceneController | undefined;

export function getSceneModuleKey(preset: ProjectItem["visualPreset"]): ImmersiveSceneModuleKey {
  return preset === "motor-lab" ? "motor-lab" : "signal";
}

export async function loadImmersiveScene(preset: ProjectItem["visualPreset"]): Promise<ImmersiveSceneMount> {
  if (getSceneModuleKey(preset) === "motor-lab") {
    const { mountMotorStorySequence } = await import("./motorStorySequence.ts");
    return (host, chapters) => mountMotorStorySequence(host, chapters);
  }

  const { mountSignalOrbitScene } = await import("./scene.ts");
  return (host, chapters) => mountSignalOrbitScene(host, chapters);
}
