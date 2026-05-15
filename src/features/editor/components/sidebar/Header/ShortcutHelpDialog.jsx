import React from 'react';
import { CircleHelp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const shortcutSections = [
  {
    title: 'Core shortcuts',
    items: [
      {
        keys: ['V'],
        action: 'Switch to Select tool',
        reason: 'Jump back to moving, resizing, and selecting layers quickly.',
      },
      {
        keys: ['P'],
        action: 'Switch to Pen tool',
        reason: 'Start drawing or editing vector paths without hunting in the toolbar.',
      },
      {
        keys: ['Ctrl/Cmd', 'Z'],
        action: 'Undo',
        reason: 'Step back from the last canvas change.',
      },
      {
        keys: ['Ctrl/Cmd', 'Y'],
        action: 'Redo',
        reason: 'Re-apply a change you just undid.',
      },
      {
        keys: ['Ctrl/Cmd', 'Shift', 'Z'],
        action: 'Redo',
        reason: 'Alternative redo shortcut used in many design tools.',
      },
      {
        keys: ['Ctrl/Cmd', 'D'],
        action: 'Duplicate selected object',
        reason: 'Create a quick copy when building repeated layouts.',
      },
      {
        keys: ['Delete'],
        action: 'Delete selected object or points',
        reason: 'Remove canvas items or selected Pen points without extra clicks.',
      },
      {
        keys: ['Backspace'],
        action: 'Delete selected object or points',
        reason: 'Same cleanup action using the backspace key.',
      },
      {
        keys: ['Ctrl/Cmd', 'Shift', "'"],
        action: 'Toggle snap',
        reason: 'Turn snapping on or off when you need strict alignment or freer placement.',
      },
    ],
  },
  {
    title: 'Pen tool shortcuts',
    items: [
      {
        keys: ['Enter'],
        action: 'Finish the current open path',
        reason: 'Commit the path you are drawing without closing the shape.',
      },
      {
        keys: ['Escape'],
        action: 'Exit Pen mode and return to Select',
        reason: 'Quickly stop editing and get back to normal selection behavior.',
      },
      {
        keys: ['Ctrl/Cmd', 'B'],
        action: 'Break path at selected point',
        reason: 'Split a path so you can open or separate segments while editing.',
      },
      {
        keys: ['Ctrl/Cmd', 'J'],
        action: 'Join selected points',
        reason: 'Reconnect endpoints or close an open shape faster.',
      },
      {
        keys: ['Alt + Click'],
        action: 'Toggle anchor between corner and smooth',
        reason: 'Change the curve feel of a point while refining vector paths.',
      },
      {
        keys: ['Alt + Drag'],
        action: 'Break handle symmetry',
        reason: 'Edit one Bezier handle independently for sharper custom curves.',
      },
      {
        keys: ['Shift + Click'],
        action: 'Multi-select anchor points',
        reason: 'Adjust several anchors together during path editing.',
      },
    ],
  },
  {
    title: 'Useful mouse actions',
    items: [
      {
        keys: ['Double-click path'],
        action: 'Enter Pen edit mode',
        reason: 'Re-open a vector path later to refine points and handles.',
      },
      {
        keys: ['Right-click + drag'],
        action: 'Pan the canvas',
        reason: 'Move around the workspace without switching tools.',
      },
      {
        keys: ['Click + drag with Pen'],
        action: 'Create a smooth point with handles',
        reason: 'Draw curved segments in a single gesture.',
      },
      {
        keys: ['Click first Pen point'],
        action: 'Close the current path',
        reason: 'Finish a shape as a loop for filled vector artwork.',
      },
    ],
  },
];

const ShortcutPill = ({ children }) => (
  <span className="inline-flex min-w-8 items-center justify-center rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
    {children}
  </span>
);

const ShortcutHelpDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CircleHelp className="h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col p-0">
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>Keyboard shortcuts and editing help</DialogTitle>
          <DialogDescription>
            Use these shortcuts to move faster in the editor. `Cmd` works on macOS and `Ctrl` works
            on Windows and Linux.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {shortcutSections.map((section) => (
              <section key={section.title} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">{section.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    What the shortcut does and why it exists in the workflow.
                  </p>
                </div>

                <div className="space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={`${section.title}-${item.action}`}
                      className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[220px_minmax(0,1fr)]"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        {item.keys.map((key) => (
                          <React.Fragment key={`${item.action}-${key}`}>
                            <ShortcutPill>{key}</ShortcutPill>
                          </React.Fragment>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortcutHelpDialog;
