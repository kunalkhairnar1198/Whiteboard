import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SidebarProvider = ({ className, ...props }) => (
  <div className={cn('group/sidebar-wrapper flex min-h-screen w-full', className)} {...props} />
);

const Sidebar = React.forwardRef(
  ({ className, side = 'left', mobileOpen = false, onToggle, children, ...props }, ref) => (
    <aside
      ref={ref}
      data-side={side}
      data-state={mobileOpen ? 'open' : 'closed'}
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border flex h-full flex-col border shadow-sm transition-all duration-300 ease-in-out relative',
        'fixed inset-y-0 z-40 sm:relative sm:z-[60] sm:transform-none',
        side === 'left'
          ? mobileOpen
            ? 'w-72 translate-x-0 left-0 border-r'
            : 'w-0 left-0 border-none'
          : mobileOpen
            ? 'w-72 translate-x-0 right-0 border-l'
            : 'w-0 right-0 border-none',
        className,
      )}
      {...props}
    >
      {/* Internal wrapper that hides content when collapsed */}
      <div className="flex h-full w-full flex-col overflow-hidden">{children}</div>

      {/* Persistent Toggle Button */}
      {onToggle && (
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggle}
          className={cn(
            'absolute top-4 h-10 w-8 z-[100] transition-all duration-300 bg-white hover:bg-slate-50 flex items-center justify-center border border-slate-200 shadow-xl',
            side === 'left'
              ? 'left-full rounded-r-xl -ml-[1px]'
              : 'right-full rounded-l-xl -mr-[1px]',
          )}
          title={mobileOpen ? 'Collapse' : 'Expand'}
        >
          {side === 'left' ? (
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                !mobileOpen && 'rotate-180',
              )}
            />
          ) : (
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                !mobileOpen && 'rotate-180',
              )}
            />
          )}
        </Button>
      )}
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
    className={cn(
      'px-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground',
      className,
    )}
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
