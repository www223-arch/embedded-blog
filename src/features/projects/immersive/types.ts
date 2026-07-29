export type ProjectChapterStatus = "past" | "current" | "future" | "open" | "resolved";

export type ProjectChapter = {
  id: string;
  railLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  status: ProjectChapterStatus;
  media: string;
  document?: string;
};

export type ImmersiveSceneController = {
  setActiveChapter(index: number): void;
  setDiagnosticMode?(active: boolean): void;
  dispose(): void;
};
