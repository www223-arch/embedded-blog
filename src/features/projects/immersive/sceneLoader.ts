import type { ProjectItem } from "../../../content/schema.ts";
import type { MotorLabPart } from "./motorLabState.ts";
import type { ImmersiveSceneController, ProjectChapter } from "./types.ts";

export type ImmersiveSceneModuleKey = "signal" | "motor-lab";
export type ImmersiveSceneMountOptions = {
  onPartChange?: (part: MotorLabPart) => void;
};
export type ImmersiveSceneMount = (
  host: HTMLElement,
  chapters: ProjectChapter[],
  options?: ImmersiveSceneMountOptions
) => ImmersiveSceneController | undefined;

export function getSceneModuleKey(preset: ProjectItem["visualPreset"]): ImmersiveSceneModuleKey {
  return preset === "motor-lab" ? "motor-lab" : "signal";
}

export async function loadImmersiveScene(preset: ProjectItem["visualPreset"]): Promise<ImmersiveSceneMount> {
  if (getSceneModuleKey(preset) === "motor-lab") {
    const { mountMotorLabScene } = await import("./motorLabScene.ts");
    return (host, chapters, options) => mountMotorLabScene(host, chapters, options?.onPartChange);
  }

  const { mountSignalOrbitScene } = await import("./scene.ts");
  return (host, chapters) => mountSignalOrbitScene(host, chapters);
}
