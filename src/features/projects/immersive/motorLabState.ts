export type MotorLabPart = "assembly" | "rotor" | "encoder" | "phases";

export type MotorLabState = {
  activeIndex: number;
  diagnostic: boolean;
  selectedPart: MotorLabPart;
  cameraZ: number;
  housingOpacity: number;
  rippleStrength: number;
};

export type MotorLabReadout = {
  modeLabel: string;
  partLabel: string;
  commandLabel: string;
};

const DEFAULT_DRAG_THRESHOLD = 6;

export function createMotorLabState(
  chapterCount: number,
  activeIndex: number,
  diagnostic: boolean,
  selectedPart: MotorLabPart = "assembly"
): MotorLabState {
  const lastIndex = Math.max(chapterCount - 1, 0);
  const safeIndex = Math.min(Math.max(activeIndex, 0), lastIndex);

  return {
    activeIndex: safeIndex,
    diagnostic,
    selectedPart,
    cameraZ: diagnostic ? 4.78 : 5.8,
    housingOpacity: diagnostic ? 0.24 : 0.78,
    rippleStrength: diagnostic ? 0.92 : 0.2
  };
}

export function isPointerDrag(distanceSquared: number, threshold = DEFAULT_DRAG_THRESHOLD): boolean {
  return distanceSquared > threshold * threshold;
}

export function getMotorLabReadout(part: MotorLabPart, diagnostic: boolean): MotorLabReadout {
  const partLabels: Record<MotorLabPart, string> = {
    assembly: "整机装配",
    rotor: "转子与输出轴",
    encoder: "编码器与零位",
    phases: "三相定子路径"
  };

  return {
    modeLabel: diagnostic ? "诊断模式" : "观察模式",
    partLabel: partLabels[part],
    commandLabel: diagnostic ? "退出诊断模式" : "点亮当前实验"
  };
}
