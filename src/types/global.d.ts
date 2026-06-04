interface Navigator {
  standalone?: boolean;
}

interface SyncManager {
  register(tag: string, options?: { minInterval?: number }): Promise<void>;
}

interface ServiceWorkerRegistration {
  sync?: { register(tag: string): Promise<void> };
  periodicSync?: SyncManager;
}

type ExtendedPermissionName = PermissionName | "periodic-background-sync";

interface Permissions {
  query(permissionDesc: { name: ExtendedPermissionName }): Promise<PermissionStatus>;
}
