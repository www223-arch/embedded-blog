export type RouteKey = "home" | "docs" | "projects" | "life" | "board" | "playground" | "project-detail" | "life-detail" | "doc-detail";\n\nexport type RouteParams = {\n  id?: string;\n};

export type MountContext = {
  app: HTMLElement;
};

export type ViewModule = {
  key: RouteKey;
  title: string;
  mount: (ctx: MountContext) => void;
};
