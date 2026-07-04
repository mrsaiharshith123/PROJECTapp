import { cn } from "../utils/cn.js";

/**
 * Tab panel with fade-in on mount — pair with SegmentedControl; pass key={activeTab} on parent when switching.
 * @param {{ tabId: string, activeTab: string, children: import('react').ReactNode, className?: string }} props
 */
export function TabContent({ tabId, activeTab, children, className = "" }) {
  if (activeTab !== tabId) return null;
  return (
    <div key={activeTab} className={cn("ed-tab-content", className)}>
      {children}
    </div>
  );
}

export default TabContent;
