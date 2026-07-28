export type ProjectChapterStatus = "past" | "current" | "future" | "open" | "resolved";

export type ProjectChapter = {
  id: string;
  railLabel: string;
  eyebrow: string;
  title: string;
  body: string;
  status: ProjectChapterStatus;
  media: string;
};
