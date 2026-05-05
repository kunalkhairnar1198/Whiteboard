import React from 'react';
import { cn } from '@/lib/utils';

const SidebarProvider = ({ className, ...props }) => (
  <div className={cn('group/sidebar-wrapper flex min-h-screen w-full', className)} {...props} />
);

const Sidebar = React.forwardRef(
  ({ className, side = 'left', mobileOpen = false, children, ...props }, ref) => (
    <aside
      ref={ref}
      data-side={side}
      data-state={mobileOpen ? 'open' : 'closed'}
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full flex-col border shadow-sm',
        side === 'left'
          ? mobileOpen
            ? 'translate-x-0 left-0 border-r'
            : '-translate-x-full left-0 border-r sm:translate-x-0'
          : mobileOpen
          ? 'translate-x-0 right-0 border-l'
          : 'translate-x-full right-0 border-l sm:translate-x-0',
        'fixed inset-y-0 z-30 w-72 transition-transform sm:static sm:z-0 sm:transform-none',
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  ),
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-2 border-b px-4 py-4', className)} {...props} />
));
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-1 overflow-y-auto px-4 py-4', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

const SidebarGroup = React.forwardRef(({ className, ...props }, ref) => (
  <section ref={ref} className={cn('mb-5 space-y-3', className)} {...props} />
));
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground', className)}
    {...props}
  />
));
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarInset = React.forwardRef(({ className, ...props }, ref) => (
  <main ref={ref} className={cn('flex min-w-0 flex-1 flex-col', className)} {...props} />
));
SidebarInset.displayName = 'SidebarInset';

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
};
