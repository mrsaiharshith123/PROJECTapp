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

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string; reason?: string } }) => void): void;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

interface Window {
  Razorpay?: RazorpayConstructor;
  __commitTrackDev?: {
    simulatePayment?: (tier: "pro" | "power") => Promise<{ paymentId: string; tier: "pro" | "power" }>;
    resetSubscription?: () => { tier: "free" };
  };
}
