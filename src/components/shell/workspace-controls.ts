/**
 * Flattens the viewer-editing control and the account trigger into plain rows.
 * Their own styles draw bordered, shadowed cards; inside a workspace sidebar or
 * a controls dialog they sit as quiet rows instead.
 */
export const WORKSPACE_FLAT_CONTROLS =
  "[&_.viewer-collaboration-control]:border-0! [&_.viewer-collaboration-control]:shadow-none! [&_.viewer-collaboration-control]:bg-transparent! [&_.viewer-collaboration-control]:p-2! [&_.viewer-collaboration-control]:m-0! [&_.viewer-collaboration-control_small]:hidden [&_.viewer-collaboration-control_strong]:font-normal! [&_.viewer-collaboration-control_strong]:text-base! [&_.viewer-collaboration-control__icon]:bg-transparent! [&_.viewer-collaboration-control__icon]:text-secondary! [&_.viewer-collaboration-status]:border-0! [&_.viewer-collaboration-status]:shadow-none! [&_.viewer-collaboration-status]:bg-transparent! [&_.current-user]:border-0! [&_.current-user]:shadow-none! [&_.current-user]:bg-transparent! [&_.current-user]:rounded-md! [&_.current-user]:p-2! [&_.current-user:hover]:bg-surface-hover! [&_.current-user_strong]:text-sm! [&_.current-user_small]:text-xs!";
