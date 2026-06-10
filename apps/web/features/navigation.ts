import {
  adminNavigation as adminNavigationValue,
  breederNavigation as breederNavigationValue,
  canRoleSeeNavigationItem as canSeeNavigationItem,
  getNavigationForRole as getRoleNavigation,
  roleNavigationGroups as navigationGroups,
  stationNavigation as stationNavigationValue,
} from "./navigation.mjs";

export type NavigationRoleCode = "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";

export interface NavigationItem {
  href: string;
  label: string;
}

export const adminNavigation: readonly NavigationItem[] = adminNavigationValue;
export const breederNavigation: readonly NavigationItem[] = breederNavigationValue;
export const stationNavigation: readonly NavigationItem[] = stationNavigationValue;
export const roleNavigationGroups: Readonly<
  Record<NavigationRoleCode, readonly NavigationItem[]>
> = navigationGroups;

export function getNavigationForRole(roleCode: unknown): readonly NavigationItem[] {
  return getRoleNavigation(roleCode);
}

export function canRoleSeeNavigationItem(roleCode: unknown, href: string): boolean {
  return canSeeNavigationItem(roleCode, href);
}
