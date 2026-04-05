import type { RouteKey, RouteParams } from "./types";

const defaultRoute: RouteKey = "home";

export const routeList: RouteKey[] = ["home", "docs", "projects", "life", "board", "playground", "project-detail", "life-detail", "doc-detail"];

export function getCurrentRoute(): { route: RouteKey; params: RouteParams } {
  const hash = window.location.hash.replace("#", "");
  const parts = hash.split("/");
  const route = parts[0] as RouteKey;
  const params: RouteParams = {};
  
  if (parts.length > 1 && (route === "project-detail" || route === "life-detail" || route === "doc-detail")) {
    params.id = parts[1];
  }
  
  return { 
    route: routeList.includes(route) ? route : defaultRoute, 
    params 
  };
}

export function navigate(route: RouteKey, params?: RouteParams): void {
  let hash = route;
  if (params && params.id) {
    hash += `/${params.id}`;
  }
  window.location.hash = hash;
}

export function onRouteChange(cb: (routeInfo: { route: RouteKey; params: RouteParams }) => void): () => void {
  const handler = () => cb(getCurrentRoute());
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
