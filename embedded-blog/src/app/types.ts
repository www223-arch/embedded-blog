export type RouteKey = "home" | "docs" | "projects" | "life" | "board" | "playground";

export type MountContext = {
  app: HTMLElement;
};

export type ViewModule = {
  key: RouteKey;
  title: string;
  mount: (ctx: MountContext) => void;
};
