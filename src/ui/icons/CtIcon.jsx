/**
 * Perovo icon system — Phosphor Icons
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
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  CaretRight,
  ClockCounterClockwise,
  Crown,
  Info,
  MapPin,
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
  ChatDots,
  Check,
  ClipboardText,
  Cloud,
  Coin,
  Coins,
  CreditCard,
  CurrencyInr,
  DeviceMobile,
  Eye,
  EyeSlash,
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
  MagnifyingGlass,
  NotePencil,
  Package,
  Palette,
  Plus,
  PushPin,
  Receipt,
  Scroll,
  Scales,
  Shield,
  SignOut,
  ShoppingCart,
  Target,
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
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrows-clockwise": ArrowsClockwise,
  "caret-right": CaretRight,
  "chevron-right": CaretRight,
  "clock-counter-clockwise": ClockCounterClockwise,
  crown: Crown,
  info: Info,
  "map-pin": MapPin,
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
  "chat-dots": ChatDots,
  check: Check,
  "clipboard-text": ClipboardText,
  cloud: Cloud,
  coin: Coin,
  coins: Coins,
  "credit-card": CreditCard,
  "currency-inr": CurrencyInr,
  "device-mobile": DeviceMobile,
  eye: Eye,
  "eye-slash": EyeSlash,
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
  "magnifying-glass": MagnifyingGlass,
  "note-pencil": NotePencil,
  package: Package,
  palette: Palette,
  plus: Plus,
  "push-pin": PushPin,
  receipt: Receipt,
  scroll: Scroll,
  scales: Scales,
  shield: Shield,
  "sign-out": SignOut,
  "shopping-cart": ShoppingCart,
  target: Target,
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
