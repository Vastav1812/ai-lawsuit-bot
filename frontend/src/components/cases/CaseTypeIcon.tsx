// src/components/cases/CaseTypeIcon.tsx
import { 
    AlertTriangle, 
    Database, 
    Settings, 
    Coins,
    FileWarning
  } from 'lucide-react';
  import { ClaimType } from '@/lib/types';
  import { cn } from '@/lib/utils';
  
  interface CaseTypeIconProps {
    type: ClaimType;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  
  export function CaseTypeIcon({ type, size = 'md', className }: CaseTypeIconProps) {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6'
    };
  
    const getIcon = () => {
      switch (type) {
        case ClaimType.API_FRAUD:
          return <AlertTriangle className={cn(sizeClasses[size], 'text-red-400', className)} />;
        case ClaimType.DATA_THEFT:
          return <Database className={cn(sizeClasses[size], 'text-purple-400', className)} />;
        case ClaimType.SERVICE_MANIPULATION:
          return <Settings className={cn(sizeClasses[size], 'text-blue-400', className)} />;
        case ClaimType.TOKEN_FRAUD:
          return <Coins className={cn(sizeClasses[size], 'text-yellow-400', className)} />;
        default:
          return <FileWarning className={cn(sizeClasses[size], 'text-gray-400', className)} />;
      }
    };
  
    return (
      <div className="inline-flex items-center justify-center">
        {getIcon()}
      </div>
    );
  }