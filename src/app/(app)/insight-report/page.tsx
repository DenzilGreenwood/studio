// src/app/(app)/insight-report/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Eye, Edit, Trash2, Search, FileText, List, Clock } from 'lucide-react';
import { InsightReportComponent } from '@/components/insight-report';
import { useAuth } from '@/context/auth-context';
import { useEncryption } from '@/lib/encryption-context';
import { useToast } from "@/hooks/use-toast";
import { insightReportOperations, clarityMapOperations } from '@/lib/clarity-map-operations';
import { InsightReport } from '@/types';

export default function InsightReportPage() {
  const [insightReports, setInsightReports] = useState<InsightReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<InsightReport | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'timeline' | 'report'>('list');
  const [sessionData, setSessionData] = useState<{
    circumstance?: string;
    chatHistory?: Array<{
      sender: 'user' | 'ai';
      text: string;
      timestamp: string;
    }>;
    keyStatements?: {
      reframedBelief?: string;
      legacyStatement?: string;
      insights?: string[];
    };
  } | null>(null);
  
  const { user } = useAuth();
  const { userPassphrase } = useEncryption();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      const clarityMapId = searchParams.get('clarityMapId');
      const title = searchParams.get('title');
      
      if (clarityMapId && title) {
        // Creating a new report from a clarity map
        setIsCreatingNew(true);
        setViewMode('report');
        try {
          const clarityMap = await clarityMapOperations.get(clarityMapId, userPassphrase || undefined);
          if (clarityMap) {
            setSessionData({
              circumstance: clarityMap.title,
              keyStatements: {
                insights: clarityMap.nodes
                  .filter(node => node.type === 'insight')
                  .map(node => node.data.label)
              }
            });
          }
        } catch {
          toast({
            title: "Error",
            description: "Failed to load clarity map data.",
            variant: "destructive",
          });
        }
      } else if (user) {
        try {
          setIsLoading(true);
          const reports = await insightReportOperations.getByUser(user.uid, userPassphrase || undefined);
          setInsightReports(reports);
        } catch {
          toast({
            title: "Error",
            description: "Failed to load insight reports. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadData();
  }, [user, userPassphrase, searchParams, toast]);

  const handleSaveReport = async (report: InsightReport) => {
    try {
      if (report.id && insightReports.find(r => r.id === report.id)) {
        await insightReportOperations.update(report);
        setInsightReports(prev => prev.map(r => r.id === report.id ? report : r));
        toast({
          title: "Success",
          description: "Insight report updated successfully!",
        });
      } else {
        await insightReportOperations.create(report);
        setInsightReports(prev => [report, ...prev]);
        toast({
          title: "Success",
          description: "Insight report created successfully!",
        });
      }
      setIsCreatingNew(false);
      setSelectedReport(null);
      setViewMode('list');
      // Clear URL parameters
      router.replace('/insight-report');
    } catch {
      toast({
        title: "Error",
        description: "Failed to save insight report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await insightReportOperations.delete(reportId);
      setInsightReports(prev => prev.filter(r => r.id !== reportId));
      toast({
        title: "Success",
        description: "Insight report deleted successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete insight report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredReports = insightReports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (report.sessionId && report.sessionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (viewMode === 'report') {
    const title = searchParams.get('title') || 'Insight Report';
    
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {isCreatingNew ? `Create: ${title}` : selectedReport ? `Edit: ${selectedReport.title}` : 'Insight Report'}
          </h1>
          <Button 
            onClick={() => {
              setViewMode('list');
              setIsCreatingNew(false);
              setSelectedReport(null);
              setSessionData(null);
              router.replace('/insight-report');
            }}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Back to List
          </Button>
        </div>
        
        <InsightReportComponent
          existingReport={selectedReport || undefined}
          onSave={handleSaveReport}
          readonly={false}
          sessionData={sessionData || undefined}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Insight Reports</h1>
        <Button 
          onClick={() => {
            setIsCreatingNew(true);
            setSelectedReport(null);
            setViewMode('report');
          }}
          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Report
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search insight reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="w-4 h-4 mr-1" />
            Grid View
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('timeline')}
            size="sm"
          >
            <Clock className="w-4 h-4 mr-1" />
            Timeline
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : viewMode === 'timeline' ? (
        <TimelineView 
          reports={filteredReports}
          onViewReport={(report: InsightReport) => {
            setSelectedReport(report);
            setViewMode('report');
          }}
          onEditReport={(report: InsightReport) => {
            setSelectedReport(report);
            setViewMode('report');
          }}
          onDeleteReport={handleDeleteReport}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg line-clamp-2">{report.title}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewMode('report');
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewMode('report');
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteReport(report.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {report.metadata.wordCount || 0} words
                    </Badge>
                    <Badge variant="secondary">
                      v{report.metadata.version}
                    </Badge>
                    {report.sessionId && (
                      <Badge variant="outline">
                        Session linked
                      </Badge>
                    )}
                    {report.clarityMapId && (
                      <Badge variant="outline">
                        Map linked
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {report.metadata.createdAt instanceof Date ? 
                      report.metadata.createdAt.toLocaleDateString() : 
                      new Date(report.metadata.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    <p>Updated: {report.metadata.updatedAt instanceof Date ? 
                      report.metadata.updatedAt.toLocaleDateString() : 
                      new Date(report.metadata.updatedAt.seconds * 1000).toLocaleDateString()}</p>
                  </div>

                  {/* Preview of content sections */}
                  <div className="space-y-1">
                    {Object.entries(report.sections).slice(0, 3).map(([key, value], index) => (
                      value && (
                        <div key={index} className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                          <span className="font-medium">{key}:</span> {value.replace(/<[^>]*>/g, '').slice(0, 50)}...
                        </div>
                      )
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReport(report);
                        setViewMode('report');
                      }}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && filteredReports.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No insight reports found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? 
              "No reports match your search. Try adjusting your search terms." :
              "Create your first insight report to capture and reflect on your breakthrough moments."
            }
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => {
                setIsCreatingNew(true);
                setSelectedReport(null);
                setViewMode('report');
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Report
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Timeline View Component
function TimelineView({ 
  reports, 
  onViewReport, 
  onEditReport, 
  onDeleteReport 
}: {
  reports: InsightReport[];
  onViewReport: (report: InsightReport) => void;
  onEditReport: (report: InsightReport) => void;
  onDeleteReport: (reportId: string) => void;
}) {
  // Sort reports by creation date (newest first)
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = a.metadata.createdAt instanceof Date ? 
      a.metadata.createdAt : 
      new Date(a.metadata.createdAt.seconds * 1000);
    const dateB = b.metadata.createdAt instanceof Date ? 
      b.metadata.createdAt : 
      new Date(b.metadata.createdAt.seconds * 1000);
    return dateB.getTime() - dateA.getTime();
  });

  // Group reports by month
  const groupedReports = sortedReports.reduce((acc, report) => {
    const date = report.metadata.createdAt instanceof Date ? 
      report.metadata.createdAt : 
      new Date(report.metadata.createdAt.seconds * 1000);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(report);
    return acc;
  }, {} as Record<string, InsightReport[]>);

  if (sortedReports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-semibold mb-2">No insight reports found</h3>
        <p className="text-muted-foreground mb-6">
          Create your first insight report to capture and reflect on your breakthrough moments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedReports).map(([month, monthReports]) => (
        <div key={month} className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{month}</h2>
            <div className="flex-1 h-px bg-border"></div>
            <Badge variant="secondary">{monthReports.length} reports</Badge>
          </div>
          
          <div className="space-y-4 ml-4">
            {monthReports.map((report, index) => (
              <div key={report.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  {index < monthReports.length - 1 && (
                    <div className="w-px h-20 bg-border mt-2"></div>
                  )}
                </div>
                
                <Card className="flex-1 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{report.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>
                            {report.metadata.createdAt instanceof Date ? 
                              report.metadata.createdAt.toLocaleDateString() : 
                              new Date(report.metadata.createdAt.seconds * 1000).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{report.metadata.wordCount || 0} words</span>
                          <span>•</span>
                          <span>v{report.metadata.version}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditReport(report)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteReport(report.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {report.sessionId && (
                          <Badge variant="outline">
                            Session linked
                          </Badge>
                        )}
                        {report.clarityMapId && (
                          <Badge variant="outline">
                            Map linked
                          </Badge>
                        )}
                      </div>
                      
                      {/* Preview of content sections */}
                      <div className="space-y-2">
                        {Object.entries(report.sections).slice(0, 2).map(([key, value]) => (
                          value && (
                            <div key={key} className="text-sm">
                              <span className="font-medium text-foreground capitalize">{key}:</span>{' '}
                              <span className="text-muted-foreground">
                                {value.replace(/<[^>]*>/g, '').slice(0, 100)}...
                              </span>
                            </div>
                          )
                        ))}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewReport(report)}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
