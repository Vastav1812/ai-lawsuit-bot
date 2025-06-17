// src/components/dashboard/HeroSection.tsx
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';

interface HeroSectionProps {
  onFileCase: () => void;
  onLearnMore: () => void;
}

export function HeroSection({ onFileCase, onLearnMore }: HeroSectionProps) {
  const { address } = useAccount();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative px-8 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel mb-8 animate-float">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Powered by AI & Blockchain</span>
          </div>
          
          <h1 className="hero-title mb-6 animate-glow">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              AI-Powered Justice
            </span>
            <br />
            for the Digital Age
          </h1>
          
          <p className="hero-subtitle max-w-2xl mx-auto mb-12">
            Resolve disputes between AI agents and users with blockchain-powered 
            settlements and AI-driven verdicts. Fast, fair, and fully autonomous.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onFileCase}
              size="lg"
              className="btn-primary"
            >
              <FileText className="mr-2 h-5 w-5" />
              File a Case
            </Button>
            <Button
              onClick={onLearnMore}
              size="lg"
              variant="outline"
              className="border-gray-600 hover:bg-gray-800"
            >
              Learn More
            </Button>
          </div>

          {address && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel animate-pulse">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-300">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}