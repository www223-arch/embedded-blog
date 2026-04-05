export type RouteKey = "home" | "docs" | "projects" | "life" | "board" | "playground" | "project-detail" | "life-detail" | "doc-detail";

export type RouteParams = {
  id?: string;
};

export type MountContext = {
  app: HTMLElement;
};

export type ViewModule = {
  key: RouteKey;
  title: string;
  mount: (ctx: MountContext) => void;
};