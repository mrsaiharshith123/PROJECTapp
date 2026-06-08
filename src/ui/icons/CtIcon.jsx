/**
 * CommitTrack icon system — Phosphor Icons
 *
 * Weight guide:
 *   fill     → nav (active), primary action buttons
 *   bold     → category chips, emphasis
 *   duotone  → status indicators, feature tiles, module icons
 *   regular  → inline icons, secondary actions, info tips
 *   thin     → empty states, illustrations
 *
 * Emoji policy:
 *   ✓ Use in: onboarding text, guidance prose, empty state body,
 *             AI advisor responses, user-entered content
 *   ✗ Do not use in: buttons, badges, headings, modal titles,
 *                     navigation, card headers, page headers
 */
import {
  ArrowsClockwise,
  Backpack,
  Bank,
  Bell,
  Book,
  BookOpen,
  Briefcase,
  Bus,
  Calculator,
  Calendar,
  Car,
  ChartBar,
  ChartLineDown,
  ChartLineUp,
  ChatCircle,
  Check,
  ClipboardText,
  Cloud,
  Coin,
  Coins,
  CreditCard,
  CurrencyInr,
  DeviceMobile,
  FileText,
  FirstAid,
  ForkKnife,
  Gear,
  Handshake,
  Hourglass,
  House,
  Laptop,
  Lightning,
  Lock,
  NotePencil,
  Package,
  Palette,
  PushPin,
  Receipt,
  Scroll,
  Shield,
  ShoppingCart,
  Television,
  User,
  UserCircle,
  Users,
  UsersThree,
  Wallet,
  Warning,
  Wrench,
} from "@phosphor-icons/react";
import { cn } from "../utils/cn.js";

/** @type {Record<string, import('@phosphor-icons/react').Icon>} */
const ICON_REGISTRY = {
  "arrows-clockwise": ArrowsClockwise,
  backpack: Backpack,
  bank: Bank,
  bell: Bell,
  book: Book,
  "book-open": BookOpen,
  briefcase: Briefcase,
  bus: Bus,
  calculator: Calculator,
  calendar: Calendar,
  car: Car,
  "chart-bar": ChartBar,
  "chart-line-down": ChartLineDown,
  "chart-line-up": ChartLineUp,
  "chat-circle": ChatCircle,
  check: Check,
  "clipboard-text": ClipboardText,
  cloud: Cloud,
  coin: Coin,
  coins: Coins,
  "credit-card": CreditCard,
  "currency-inr": CurrencyInr,
  "device-mobile": DeviceMobile,
  "file-text": FileText,
  "first-aid": FirstAid,
  "fork-knife": ForkKnife,
  gear: Gear,
  handshake: Handshake,
  hourglass: Hourglass,
  house: House,
  laptop: Laptop,
  lightning: Lightning,
  lock: Lock,
  "note-pencil": NotePencil,
  package: Package,
  palette: Palette,
  "push-pin": PushPin,
  receipt: Receipt,
  scroll: Scroll,
  shield: Shield,
  "shopping-cart": ShoppingCart,
  television: Television,
  user: User,
  "user-circle": UserCircle,
  users: Users,
  "users-three": UsersThree,
  wallet: Wallet,
  warning: Warning,
  wrench: Wrench,
};

/** @type {Record<string, import('@phosphor-icons/react').IconWeight>} */
const CONTEXT_WEIGHTS = {
  nav: "fill",
  "nav-off": "regular",
  category: "bold",
  action: "fill",
  status: "duotone",
  tile: "duotone",
  empty: "thin",
  info: "regular",
};

/**
 * @param {{
 *   name: string,
 *   size?: number | string,
 *   weight?: import('@phosphor-icons/react').IconWeight,
 *   context?: keyof typeof CONTEXT_WEIGHTS | string,
 *   className?: string,
 * }} props
 */
export function CtIcon({ name, size = 20, weight, context, className = "" }) {
  const Icon = ICON_REGISTRY[name];
  if (!Icon) return null;
  const resolvedWeight = weight ?? (context ? CONTEXT_WEIGHTS[context] : undefined) ?? "regular";
  return <Icon size={size} weight={resolvedWeight} className={cn("ct-icon", className)} aria-hidden />;
}

export default CtIcon;
