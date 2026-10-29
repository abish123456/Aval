// ---------------------------------------------------------------------------
// RBAC — Role-Based Access Control
// ---------------------------------------------------------------------------

export type Permission =
  // Product management
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  // Category management
  | 'categories:read'
  | 'categories:write'
  // Inventory
  | 'inventory:read'
  | 'inventory:adjust'
  // Order management
  | 'orders:read'
  | 'orders:update_status'
  | 'orders:refund'          // OWNER only
  // Custom orders
  | 'custom_orders:read'
  | 'custom_orders:write'
  // Customer management
  | 'customers:read'
  | 'customers:export'       // OWNER only
  // Promotions & Coupons
  | 'promotions:read'
  | 'promotions:write'
  | 'promotions:delete'
  // Reviews
  | 'reviews:read'
  | 'reviews:moderate'
  // Reports
  | 'reports:read'
  | 'reports:export'
  // Settings
  | 'settings:read'
  | 'settings:write'         // OWNER only
  // Users / Admins
  | 'users:read'
  | 'users:write'            // OWNER only
  // Audit logs
  | 'audit:read'             // OWNER only
  // Customer self-service
  | 'account:own_orders'
  | 'account:own_profile'
  | 'account:wishlist'
  | 'account:reviews_write'

// ---------------------------------------------------------------------------
// Permission Matrix
// ---------------------------------------------------------------------------

const OWNER_PERMISSIONS: Permission[] = [
  'products:read', 'products:write', 'products:delete',
  'categories:read', 'categories:write',
  'inventory:read', 'inventory:adjust',
  'orders:read', 'orders:update_status', 'orders:refund',
  'custom_orders:read', 'custom_orders:write',
  'customers:read', 'customers:export',
  'promotions:read', 'promotions:write', 'promotions:delete',
  'reviews:read', 'reviews:moderate',
  'reports:read', 'reports:export',
  'settings:read', 'settings:write',
  'users:read', 'users:write',
  'audit:read',
  'account:own_orders', 'account:own_profile', 'account:wishlist', 'account:reviews_write',
]

const STAFF_PERMISSIONS: Permission[] = [
  'products:read', 'products:write',
  'categories:read', 'categories:write',
  'inventory:read', 'inventory:adjust',
  'orders:read', 'orders:update_status',
  'custom_orders:read', 'custom_orders:write',
  'customers:read',
  'promotions:read', 'promotions:write',
  'reviews:read', 'reviews:moderate',
  'reports:read',
  'settings:read',
  'account:own_orders', 'account:own_profile', 'account:wishlist', 'account:reviews_write',
]

const CUSTOMER_PERMISSIONS: Permission[] = [
  'account:own_orders',
  'account:own_profile',
  'account:wishlist',
  'account:reviews_write',
]

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  OWNER: OWNER_PERMISSIONS,
  STAFF: STAFF_PERMISSIONS,
  CUSTOMER: CUSTOMER_PERMISSIONS,
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function requirePermission(role: string | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new PermissionError(permission)
  }
}

export function isAdmin(role: string): boolean {
  return role === 'OWNER' || role === 'STAFF'
}

// ---------------------------------------------------------------------------
// Error classes
// ---------------------------------------------------------------------------

export class PermissionError extends Error {
  statusCode = 403
  constructor(permission: Permission) {
    super(`Access denied: missing permission '${permission}'`)
    this.name = 'PermissionError'
  }
}

export class AuthError extends Error {
  statusCode = 401
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthError'
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  constructor(entity = 'Resource') {
    super(`${entity} not found`)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends Error {
  statusCode = 422
  issues: unknown
  constructor(message: string, issues?: unknown) {
    super(message)
    this.name = 'ValidationError'
    this.issues = issues
  }
}

export class ConflictError extends Error {
  statusCode = 409
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.name = 'ConflictError'
    this.code = code
  }
}

