import type { RouteKey } from "./types";

export type FeatureCleanup = () => void;
export type FeatureMountResult = void | FeatureCleanup | FeatureCleanup[] | Promise<void | FeatureCleanup | FeatureCleanup[]>;

export type FeatureModule = {
  key: RouteKey;
  label: string;
  title: string;
  render: () => string;
  afterMount?: () => FeatureMountResult;
  visibleInNav?: boolean;
};

const modules = new Map<RouteKey, FeatureModule>();

export function register(feature: FeatureModule): void {
  modules.set(feature.key, feature);
}

export function getModules(): FeatureModule[] {
  return [...modules.values()];
}

export function getNavModules(): FeatureModule[] {
  return [...modules.values()].filter((module) => module.visibleInNav !== false);
}

export function getModule(route: RouteKey): FeatureModule | undefined {
  return modules.get(route);
}
