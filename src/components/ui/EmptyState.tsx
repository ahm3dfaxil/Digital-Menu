import React from "react";
import * as Icons from "lucide-react";
import Button from "./Button";

interface EmptyStateProps {
  icon: keyof typeof Icons;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const IconComponent = Icons[icon] as React.ComponentType<{ className?: string }>;

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-300 dark:border-slate-800 rounded-premium-lg bg-slate-50/50 dark:bg-slate-900/20 py-12">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 mb-4">
        {IconComponent && <IconComponent className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-heading mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
export default EmptyState;
