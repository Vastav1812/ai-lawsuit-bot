// src/components/precedent/PrecedentDetails.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Scale, 
  Users,
  DollarSign,
  Quote,
  ExternalLink,
  Copy,
  Download,
  Share2,
  BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface PrecedentDetailsProps {
  precedent: {
    id: string;
    caseId: string;
    type: string;
    filedDate: string;
    settledDate: string;
    plaintiff: string;
    defendant: string;
    verdict: 'guilty' | 'not_guilty';
    awardedDamages?: string;
    requestedDamages: string;
    summary: string;
    fullDetails: {
      facts: string;
      legalReasoning: string;
      precedentsCited: string[];
      keyPrinciples: string[];
      dissenting?: string;
    };
    citationCount: number;
    relatedCases: string[];
  };
  className?: string;
}

export function PrecedentDetails({ precedent, className }: PrecedentDetailsProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const downloadPDF = () => {
    // In production, this would generate and download a PDF
    toast.success('Downloading precedent PDF...');
  };

  const sharePrecedent = () => {
    const url = `${window.location.origin}/precedents/${precedent.id}`;
    copyToClipboard(url, 'Share link');
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Case #{precedent.caseId}</CardTitle>
              <CardDescription className="mt-2">
                {precedent.type.replace('_', ' ')} • {format(new Date(precedent.settledDate), 'MMMM d, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={sharePrecedent}>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">Verdict</p>
              <Badge 
                variant={precedent.verdict === 'guilty' ? 'destructive' : 'success'}
                className="mt-1"
              >
                {precedent.verdict.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-400">Damages Awarded</p>
              <p className="font-semibold">{precedent.awardedDamages || '0'} ETH</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Citations</p>
              <p className="font-semibold">{precedent.citationCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="font-semibold">
                {Math.ceil(
                  (new Date(precedent.settledDate).getTime() - 
                   new Date(precedent.filedDate).getTime()) / 
                  (1000 * 60 * 60 * 24)
                )} days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Content */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="facts">Facts</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="principles">Principles</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Quote className="h-5 w-5" />
                Case Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-sm leading-relaxed">{precedent.summary}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Parties
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Plaintiff:</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono">
                          {precedent.plaintiff.slice(0, 6)}...{precedent.plaintiff.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(precedent.plaintiff, 'Address')}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Defendant:</span>
                      <div className="flex items-center gap-2">
                        <code className="font-mono">
                          {precedent.defendant.slice(0, 6)}...{precedent.defendant.slice(-4)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(precedent.defendant, 'Address')}
                          className="text-gray-400 hover:text-white"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Damages
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Requested:</span>
                      <span>{precedent.requestedDamages} ETH</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Awarded:</span>
                      <span className="font-semibold text-green-400">
                        {precedent.awardedDamages || '0'} ETH
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Statement of Facts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {precedent.fullDetails.facts}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reasoning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Legal Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Analysis</h4>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {precedent.fullDetails.legalReasoning}
                  </p>
                </div>
              </div>
              
              {precedent.fullDetails.precedentsCited.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Precedents Cited</h4>
                  <div className="space-y-2">
                    {precedent.fullDetails.precedentsCited.map((citation, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}
                        </Badge>
                        <span className="text-sm text-blue-400 hover:underline cursor-pointer">
                          {citation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {precedent.fullDetails.dissenting && (
                <div>
                  <h4 className="font-medium mb-3">Dissenting Opinion</h4>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">
                      {precedent.fullDetails.dissenting}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="principles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Legal Principles Established
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {precedent.fullDetails.keyPrinciples.map((principle, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{principle}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Related Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              {precedent.relatedCases.map((caseId, index) => (
                 <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                   <div className="flex items-center gap-3">
                     <FileText className="h-4 w-4 text-gray-400" />
                     <span className="font-medium">Case #{caseId}</span>
                   </div>
                   <Button variant="ghost" size="sm">
                     <ExternalLink className="h-4 w-4" />
                   </Button>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       </TabsContent>
     </Tabs>
   </div>
 );
}