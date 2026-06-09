/** Shared app context types (strict mode on; shapes stay permissive during JS migration). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthProfile = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AuthUser = Record<string, any> & { id?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppSettings = Record<string, any>;

export type AuthContextValue = {
  isReady: boolean;
  session: unknown;
  user: AuthUser | null;
  profile: AuthProfile | null;
  profileResolved: boolean;
  authNotice: string;
  error: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, metadata?: AuthProfile | null) => Promise<unknown>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  saveProfile: (patch: AuthProfile) => Promise<AuthProfile | null>;
  refreshProfile: () => Promise<AuthProfile | null>;
  clearAuthNotice: () => void;
};

export type CommitTrackContextValue = {
  commitments: AuthProfile[];
  allCommitments: AuthProfile[];
  sortedCommitments: AuthProfile[];
  lendings: AuthProfile[];
  allLendings: AuthProfile[];
  goals: AuthProfile[];
  allGoals: AuthProfile[];
  activeProfileId: string;
  settings: AppSettings;
  monthlySnapshots: AuthProfile[];
  todayStr: string;
  getEffectiveStatus: (c: AuthProfile, todayStr?: string, all?: AuthProfile[]) => string;
  getEffectiveLendingStatus: (l: AuthProfile, todayStr?: string) => string;
  addCommitment: (data: AuthProfile) => void;
  updateCommitment: (id: number | string, patch: AuthProfile) => void;
  deleteCommitment: (id: number | string) => void;
  addCommitmentPayment: (id: number | string, payment: AuthProfile) => void;
  removeCommitmentPayment: (id: number | string, paymentId: number | string) => void;
  addLending: (data: AuthProfile) => void;
  updateLending: (id: number | string, patch: AuthProfile) => void;
  deleteLending: (id: number | string) => void;
  addLendingPayment: (id: number | string, payment: AuthProfile) => void;
  updateSettings: (patch: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  addGoal: (data: AuthProfile) => void;
  updateGoal: (id: number | string, patch: AuthProfile) => void;
  deleteGoal: (id: number | string) => void;
  addDailySpend: (data: AuthProfile) => void;
  deleteDailySpend: (id: number | string) => void;
  dailySpends: AuthProfile[];
  allDailySpends: AuthProfile[];
  supplementalNotifications: AuthProfile[];
  pushInAppNotification: (item: AuthProfile) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (ids?: (string | number)[]) => void;
  logSavingsToGoal: (goalId: number | string, amount: number) => void;
  importAppData: (payload: AuthProfile, options?: AuthProfile) => unknown;
};
