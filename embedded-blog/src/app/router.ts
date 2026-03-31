import type { RouteKey } from "./types";

const defaultRoute: RouteKey = "home";

export const routeList: RouteKey[] = ["home", "docs", "projects", "life", "board", "playground"];

export function getCurrentRoute(): RouteKey {
  const hash = window.location.hash.replace("#", "") as RouteKey;
  return routeList.includes(hash) ? hash : defaultRoute;
}

export function navigate(route: RouteKey): void {
  window.location.hash = route;
}

export function onRouteChange(cb: (route: RouteKey) => void): () => void {
  const handler = () => cb(getCurrentRoute());
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
