// src/components/dashboard/FeatureCard.tsx
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  price: string;
  action: string;
  onClick: () => void;
  highlighted?: boolean;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  price,
  action,
  onClick,
  highlighted = false,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn(
      "feature-card group",
      highlighted && "border-2 border-purple-500/30", // Apply specific border for highlighted card
      className
    )}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="badge badge-primary bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            Most Popular
          </span>
        </div>
      )}
      <div className="feature-card-content">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
        <p className="text-gray-400 mb-6">{description}</p>
        <div className="flex items-center justify-between mb-6">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="badge badge-success">{action === 'Get Started' ? 'Popular' : 'Affordable'}</span>
        </div>
        <Button 
          onClick={onClick} 
          className="w-full btn-primary"
        >
          {action}
        </Button>
      </div>
    </div>
  );
}