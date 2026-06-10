export type NavigationRoleCode = "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";

export interface NavigationItem {
  href: string;
  label: string;
}

export declare const breederNavigation: readonly NavigationItem[];
export declare const stationNavigation: readonly NavigationItem[];
export declare const adminNavigation: readonly NavigationItem[];
export declare const roleNavigationGroups: Readonly<
  Record<NavigationRoleCode, readonly NavigationItem[]>
>;

export declare function getNavigationForRole(roleCode: unknown): readonly NavigationItem[];
export declare function canRoleSeeNavigationItem(roleCode: unknown, href: string): boolean;
