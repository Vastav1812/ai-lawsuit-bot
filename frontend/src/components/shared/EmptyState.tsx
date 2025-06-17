// src/components/shared/EmptyState.tsx
import { cn } from '@/lib/utils';
import { FileX, Search, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'file' | 'search' | 'folder';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'folder',
  action,
  className,
}: EmptyStateProps) {
  const icons = {
    file: FileX,
    search: Search,
    folder: FolderOpen,
  };

  const Icon = icons[icon];

  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <Icon className="h-12 w-12 text-gray-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-center max-w-md mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}