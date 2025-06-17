// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { FileText, Gavel, Sparkles, Shield, Zap, TrendingUp } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { FeatureCard } from '@/components/dashboard/FeatureCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { CaseList } from '@/components/cases/CaseList';
import { CaseFilingModal } from '@/components/cases/CaseFilingModal';
import { Button } from '@/components/ui/button';
import { API_URL } from '@/lib/constants';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface Stats {
  totalCases: number;
  totalSettlements: string;
  activeJudges: number;
  avgResolutionTime: string;
  successRate: string;
  pendingCases: number;
}

interface Activity {
  id: number;
  type: string;
  description: string;
  time: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { address } = useAccount();
  const [showFilingModal, setShowFilingModal] = useState(false);
  const [stats, setStats] = useState<Stats | undefined>(undefined);
  const [recentCases, setRecentCases] = useState([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [address]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_URL}/api/analytics/stats`);
      setStats(statsResponse.data.stats);

      // Fetch recent cases if user is connected
      if (address) {
        const casesResponse = await axios.get(`${API_URL}/api/cases-wallet/search?plaintiff=${address}&limit=3`);
        setRecentCases(casesResponse.data.cases || []);
      }

      // Fetch recent activities
      const activitiesResponse = await axios.get(`${API_URL}/api/analytics/activities/recent`);
      setActivities(activitiesResponse.data.activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileCase = () => {
    if (!address) {
      alert('Please connect your wallet to file a case');
      return;
    }
    setShowFilingModal(true);
  };

  const handleLearnMore = () => {
    router.push('/docs');
  };

  return (
    <>
      <div className="min-h-screen relative">
        {/* Animated background elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>
        </div>

        {/* Hero Section */}
        <PageContainer className="py-0 relative z-10">
          <HeroSection 
            onFileCase={handleFileCase}
            onLearnMore={handleLearnMore}
          />
        </PageContainer>

        {/* Stats Grid */}
        <PageContainer className="-mt-12 relative z-10">
          <StatsGrid stats={stats} loading={loading} />
        </PageContainer>

        {/* Features Section */}
        <PageContainer className="py-20 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Everything you need for AI dispute resolution
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform provides comprehensive tools for filing, judging, and settling disputes in the AI ecosystem.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="File Cases"
              description="Submit grievances against AI agents with evidence"
              price="$10"
              action="Get Started"
              onClick={handleFileCase}
            />
            <FeatureCard
              icon={<Gavel className="h-8 w-8" />}
              title="AI Judge"
              description="Get impartial AI-powered verdicts in minutes"
              price="$5"
              action="Learn More"
              onClick={() => router.push('/docs/ai-judge')}
              highlighted
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Search Precedents"
              description="Access case history and legal precedents"
              price="$0.50"
              action="Browse"
              onClick={() => router.push('/precedents')}
            />
          </div>
        </PageContainer>

        {/* Platform Benefits */}
        <PageContainer className="py-20 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="glass-panel p-8">
              <Shield className="w-12 h-12 mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-bold mb-2 text-white">Blockchain Security</h3>
              <p className="text-gray-400">All evidence and verdicts are immutably stored on-chain</p>
            </div>
            <div className="glass-panel p-8">
              <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <h3 className="text-xl font-bold mb-2 text-white">Lightning Fast</h3>
              <p className="text-gray-400">AI-powered decisions in minutes, not months</p>
            </div>
            <div className="glass-panel p-8">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h3 className="text-xl font-bold mb-2 text-white">Fair & Impartial</h3>
              <p className="text-gray-400">Unbiased AI judges with transparent reasoning</p>
            </div>
          </div>
        </PageContainer>

        {/* Recent Activity & Cases */}
        {address && (
          <PageContainer className="py-20 relative z-10">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 glass-panel p-8 rounded-2xl">
                <h2 className="text-3xl font-bold mb-8 text-white">Your Recent Cases</h2>
                <CaseList 
                  cases={recentCases}
                  loading={loading}
                  showPagination={false}
                  emptyMessage="You haven't filed any cases yet"
                />
                {recentCases.length > 0 && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/my-cases')}
                      className="mx-auto">
                      View All Cases
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="glass-panel p-8 rounded-2xl">
                <RecentActivity 
                  activities={activities}
                  loading={loading}
                />
              </div>
            </div>
          </PageContainer>
        )}
      </div>

      {/* Case Filing Modal */}
      {showFilingModal && (
        <CaseFilingModal 
          onClose={() => setShowFilingModal(false)}
          onSuccess={() => {
            setShowFilingModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </>
  );
}