import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Mail,
  Zap,
  Settings,
} from 'lucide-react';
import { useMobileView } from '../hooks/useMobileView';
import { cn } from '@/components/ui/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MobileBottomNavProps {
  items?: NavItem[];
  className?: string;
}

/**
 * Mobile bottom navigation bar
 * Typically shows 4-5 main navigation items
 */
export function MobileBottomNav({ items, className }: MobileBottomNavProps) {
  const { isMobile } = useMobileView();

  // Default navigation items
  const defaultItems: NavItem[] = [
    {
      label: 'Dashboard',
      to: '/app/dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />,
    },
    {
      label: 'Leads',
      to: '/app/leads',
      icon: <Users className="w-6 h-6" />,
    },
    {
      label: 'Campaigns',
      to: '/app/campaigns',
      icon: <Mail className="w-6 h-6" />,
    },
    {
      label: 'Automation',
      to: '/app/automation',
      icon: <Zap className="w-6 h-6" />,
    },
    {
      label: 'Settings',
      to: '/app/settings',
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  const navItems = items || defaultItems;

  if (!isMobile) return null;

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border',
        'flex justify-around items-center',
        'h-20 px-2 py-2',
        'safe-area-bottom',
        className
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1',
              'w-16 h-16 rounded-lg',
              'transition-colors relative',
              'text-xs font-medium',
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {item.icon}
          <span className="truncate">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileBottomNav;
