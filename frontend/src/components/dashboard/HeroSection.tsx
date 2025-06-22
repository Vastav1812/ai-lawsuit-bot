// src/components/dashboard/HeroSection.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Shield, Wallet, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export function HeroSection() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const handleFileCase = () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    router.push('/file-case');
  };

  const handleBrowsePrecedents = () => {
    router.push('/precedents');
  };

  // Format wallet address
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
      </div>
      
      {/* Wallet Connection Status - Top Center */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        {isConnected && address ? (
          <div className="bg-gradient-to-r from-green-400/10 to-blue-400/10 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">Connected:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-white">{formatAddress(address)}</span>
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 backdrop-blur-md border border-yellow-400/20 rounded-full px-6 py-3 shadow-xl flex items-center gap-2">
            <Wallet className="h-4 w-4 text-yellow-400" />
            <p className="text-sm text-yellow-300">
              Connect your wallet to get started
            </p>
          </div>
        )}
      </div>
      
      <div className="relative">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-20">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-6 order-2 lg:order-1">
              {/* Title with subtitle */}
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-wider text-gray-400">
                  Next-Gen Legal Platform
                </p>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  AI-Powered Justice
                </h1>
              </div>
              
              <p className="text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Revolutionizing dispute resolution with blockchain technology and artificial intelligence. 
                <span className="text-white"> Fast, fair, and transparent</span> justice for the digital age.
              </p>

              {/* Professional Feature Tags */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start mt-6">
                {['Instant Resolution', 'Blockchain Secured', 'AI Judge', 'Global Access'].map((feature) => (
                  <div
                    key={feature}
                    className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300"
                  >
                    {feature}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-10">
                <Button
                  size="lg"
                  onClick={handleFileCase}
                  disabled={!address}
                  className="bg-blue-600 hover:bg-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-6 text-base"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  File a Case
                  <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">$10</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBrowsePrecedents}
                  className="border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-800/70 transition-all duration-200 px-8 py-6 text-base"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  Browse Precedents
                </Button>
              </div>
            </div>

            {/* Right Column - 3D Illustration */}
            <div className="relative order-1 lg:order-2">
              <div className="relative w-full max-w-xl mx-auto">
                {/* Glow effect behind the illustration */}
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-75" />
                
                {/* 3D Illustration */}
                <div className="relative z-10">
                  <Image
                    src="/ai-courtroom-3d.png" // Add your image to public folder
                    alt="AI-Powered Digital Courtroom"
                    width={600}
                    height={600}
                    className="w-full h-auto drop-shadow-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}