// @ts-check

export const breederNavigation = Object.freeze([
  Object.freeze({ href: "/breeder-dashboard", label: "My Orders" }),
  Object.freeze({ href: "/app/catalog", label: "Browse Semen Listings" }),
  Object.freeze({ href: "/app/orders/new", label: "Create Order" }),
  Object.freeze({ href: "/app/documents/upload", label: "Documents" }),
]);

export const stationNavigation = Object.freeze([
  Object.freeze({ href: "/station-dashboard", label: "Station Overview" }),
  Object.freeze({ href: "/app/station/orders", label: "Order Management" }),
  Object.freeze({ href: "/station-dashboard#station-shipments-to-update-heading", label: "Shipments" }),
  Object.freeze({ href: "/app/documents/upload", label: "Documents" }),
  Object.freeze({ href: "/app/station/stallions", label: "Stallion Management" }),
  Object.freeze({ href: "/app/station/listings", label: "Listing Management" }),
]);

export const adminNavigation = Object.freeze([
  Object.freeze({ href: "/app/admin", label: "Admin Overview" }),
  Object.freeze({ href: "/app/admin/users", label: "Users" }),
  Object.freeze({ href: "/app/admin/invitations", label: "Invitations" }),
  Object.freeze({ href: "/app/admin/organizations", label: "Organizations" }),
  Object.freeze({ href: "/app/admin/roles", label: "Roles" }),
  Object.freeze({ href: "/app/admin/orders", label: "Order Support" }),
  Object.freeze({ href: "/app/admin/support", label: "Support Requests" }),
  Object.freeze({ href: "/app/admin/proof", label: "Proof Timeline" }),
  Object.freeze({ href: "/app/admin/audit", label: "Audit Logs" }),
  Object.freeze({ href: "/app/admin/permissions", label: "Permissions" }),
  Object.freeze({ href: "/app/admin/amendments", label: "Amendments" }),
  Object.freeze({ href: "/app/documents/upload", label: "Documents" }),
]);

export const roleNavigationGroups = Object.freeze({
  BREEDER: breederNavigation,
  BREEDING_STATION: stationNavigation,
  PLATFORM_ADMIN: adminNavigation,
});

/**
 * @param {unknown} roleCode
 * @returns {readonly import("./navigation.d.ts").NavigationItem[]}
 */
export function getNavigationForRole(roleCode) {
  return roleNavigationGroups[normalizeRoleCode(roleCode)] ?? Object.freeze([]);
}

/**
 * @param {unknown} roleCode
 * @param {string} href
 * @returns {boolean}
 */
export function canRoleSeeNavigationItem(roleCode, href) {
  return getNavigationForRole(roleCode).some((item) => item.href === href);
}

/**
 * @param {unknown} value
 * @returns {import("./navigation.d.ts").NavigationRoleCode | null}
 */
function normalizeRoleCode(value) {
  return typeof value === "string" && Object.hasOwn(roleNavigationGroups, value)
    ? /** @type {import("./navigation.d.ts").NavigationRoleCode} */ (value)
    : null;
}
