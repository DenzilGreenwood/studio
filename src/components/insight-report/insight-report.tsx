// src/components/insight-report/insight-report.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Download, 
  Edit3, 
  Eye, 
  FileText, 
  Brain, 
  Target, 
  Lightbulb,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { InsightReport } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useEncryption } from '@/lib/encryption-context';
import { encryptData } from '@/lib/encryption';
import { v4 as uuidv4 } from 'uuid';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Define ReactQuill component props interface
interface ReactQuillProps {
  value?: string;
  onChange?: (content: string) => void;
  modules?: Record<string, unknown>;
  formats?: string[];
  theme?: string;
  className?: string;
  readOnly?: boolean;
}

// Dynamically import React-Quill with React 18 compatibility
const ReactQuill = dynamic(
  () => import('react-quill').then((mod) => {
    // Return the default component directly with proper typing
    const QuillComponent = (props: ReactQuillProps) => {
      const Component = mod.default;
      return <Component {...props} />;
    };
    
    QuillComponent.displayName = 'QuillComponent';
    return { default: QuillComponent };
  }),
  { 
    ssr: false,
    loading: () => <div className="h-64 bg-gray-100 rounded animate-pulse" />
  }
);
import 'react-quill/dist/quill.snow.css';

interface InsightReportProps {
  sessionId?: string;
  existingReport?: InsightReport;
  onSave?: (report: InsightReport) => void;
  readonly?: boolean;
  sessionData?: {
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
  };
}

const quillModules = {
  toolbar: [
    [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
    [{size: []}],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{'list': 'ordered'}, {'list': 'bullet'}, 
     {'indent': '-1'}, {'indent': '+1'}],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent',
  'link', 'image'
];

const defaultSections = {
  highlights: '',
  breakthroughs: '',
  patterns: '',
  reframedBeliefs: '',
  legacyStatement: '',
  nextSteps: ''
};

export function InsightReportComponent({ 
  sessionId, 
  existingReport, 
  onSave, 
  readonly = false,
  sessionData
}: InsightReportProps) {
  const [title, setTitle] = useState(existingReport?.title || 'My Insight Report');
  const [content, setContent] = useState(existingReport?.content || '');
  const [sections, setSections] = useState(existingReport?.sections || defaultSections);
  const [currentSection, setCurrentSection] = useState<keyof typeof sections>('highlights');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { userPassphrase } = useEncryption();

  useEffect(() => {
    if (existingReport) {
      setTitle(existingReport.title);
      setContent(existingReport.content);
      setSections(existingReport.sections);
    }
  }, [existingReport]);

  const generateInsightReport = async () => {
    if (!sessionData || !user) {
      toast({
        title: "Error",
        description: "Session data is required to generate an insight report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // This would call your Genkit AI flow
      const generatedContent = await generateReportContent(sessionData);
      
      setSections(generatedContent.sections);
      setContent(generatedContent.fullContent);
      setTitle(generatedContent.title);
      
      toast({
        title: "Success",
        description: "Insight report generated successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate insight report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveReport = async () => {
    if (!user || !userPassphrase) {
      toast({
        title: "Error",
        description: "Please ensure you're logged in and have encryption enabled.",
        variant: "destructive",
      });
      return;
    }

    try {
      const reportData: InsightReport = {
        id: existingReport?.id || uuidv4(),
        userId: user.uid,
        sessionId,
        title,
        content,
        sections,
        metadata: {
          createdAt: existingReport?.metadata.createdAt || new Date(),
          updatedAt: new Date(),
          version: (existingReport?.metadata.version || 0) + 1,
          wordCount: content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        },
      };

      // Encrypt the report data
      const reportJson = JSON.stringify(reportData);
      const encrypted = await encryptData(reportJson, userPassphrase);
      
      const encryptedReport: InsightReport = {
        ...reportData,
        encryptedContent: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        content: '', // Clear unencrypted content
        sections: defaultSections,
      };

      if (onSave) {
        onSave(encryptedReport);
      }

      toast({
        title: "Success",
        description: "Insight report saved successfully!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save insight report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${title.replace(/\s+/g, '_')}_insight_report.pdf`);

      toast({
        title: "Success",
        description: "Insight report exported as PDF!",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateSection = (sectionKey: keyof typeof sections, value: string) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: value
    }));
  };

  const buildFullContent = () => {
    return `
      <div class="insight-report">
        <h1>${title}</h1>
        
        ${sections.highlights ? `
          <section class="highlights">
            <h2>✨ Highlights & Breakthroughs</h2>
            <div>${sections.highlights}</div>
          </section>
        ` : ''}
        
        ${sections.patterns ? `
          <section class="patterns">
            <h2>🧠 Patterns & Mental Models</h2>
            <div>${sections.patterns}</div>
          </section>
        ` : ''}
        
        ${sections.reframedBeliefs ? `
          <section class="reframed-beliefs">
            <h2>💭 Reframed Beliefs & Insights</h2>
            <div>${sections.reframedBeliefs}</div>
          </section>
        ` : ''}
        
        ${sections.legacyStatement ? `
          <section class="legacy-statement">
            <h2>🎯 Legacy Statement</h2>
            <div>${sections.legacyStatement}</div>
          </section>
        ` : ''}
        
        ${sections.nextSteps ? `
          <section class="next-steps">
            <h2>🚀 Next Steps & Reflection Prompts</h2>
            <div>${sections.nextSteps}</div>
          </section>
        ` : ''}
      </div>
    `;
  };

  const sectionIcons = {
    highlights: <Sparkles className="w-4 h-4" />,
    breakthroughs: <Lightbulb className="w-4 h-4" />,
    patterns: <Brain className="w-4 h-4" />,
    reframedBeliefs: <Target className="w-4 h-4" />,
    legacyStatement: <BookOpen className="w-4 h-4" />,
    nextSteps: <FileText className="w-4 h-4" />
  };

  const sectionTitles = {
    highlights: 'Highlights & Breakthroughs',
    breakthroughs: 'Breakthroughs',
    patterns: 'Patterns & Mental Models',
    reframedBeliefs: 'Reframed Beliefs',
    legacyStatement: 'Legacy Statement',
    nextSteps: 'Next Steps & Prompts'
  };

  if (previewMode) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Report Preview</h1>
          <div className="flex gap-2">
            <Button onClick={() => setPreviewMode(false)} variant="outline">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
        
        <div 
          ref={reportRef}
          className="bg-white p-8 rounded-lg shadow-lg"
          dangerouslySetInnerHTML={{ __html: buildFullContent() }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <Label htmlFor="title">Report Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
                disabled={readonly}
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto sm:ml-4">
              {sessionData && !readonly && (
                <Button 
                  onClick={generateInsightReport}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 sm:flex-none"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">Gen...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Generate Report</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </Button>
              )}
              <Button 
                onClick={() => setPreviewMode(true)} 
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <Eye className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Preview</span>
                <span className="sm:hidden">View</span>
              </Button>
              {!readonly && (
                <Button onClick={saveReport} className="flex-1 sm:flex-none">
                  <Save className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Save</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={currentSection} onValueChange={(value) => setCurrentSection(value as keyof typeof sections)}>
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full">
              {Object.entries(sectionTitles).map(([key, title]) => (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                  {sectionIcons[key as keyof typeof sectionIcons]}
                  <span className="hidden sm:inline text-xs sm:text-sm">{title}</span>
                  <span className="sm:hidden text-xs">{title.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(sections).map(([key, value]) => (
              <TabsContent key={key} value={key} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {sectionIcons[key as keyof typeof sectionIcons]}
                    <h3 className="text-lg font-semibold">
                      {sectionTitles[key as keyof typeof sectionTitles]}
                    </h3>
                  </div>
                  
                  {readonly ? (
                    <div 
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                  ) : (
                    <ReactQuill
                      value={value}
                      onChange={(content: string) => updateSection(key as keyof typeof sections, content)}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                      className="h-64 mb-12"
                    />
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// AI-powered insight report generation
async function generateReportContent(sessionData: {
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
}) {
  try {
    // Make API call to server-side endpoint instead of importing Genkit directly
    const response = await fetch('/api/generate-insight-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionData: {
          circumstance: sessionData.circumstance || 'Reflection Session',
          chatHistory: sessionData.chatHistory || [],
          keyStatements: sessionData.keyStatements
        },
        focusArea: sessionData.circumstance || undefined
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    const result = await response.json();
    return result;
  } catch {
    // Fallback to template if AI fails
    return {
      title: `Insight Report - ${sessionData.circumstance || 'Session'} - ${new Date().toLocaleDateString()}`,
      sections: {
        highlights: `<p>Key highlights from your session about ${sessionData.circumstance || 'your situation'}.</p>`,
        patterns: '<p>Mental patterns and models that emerged during our conversation.</p>',
        reframedBeliefs: `<p>${sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p>`,
        legacyStatement: `<p>${sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p>`,
        nextSteps: '<p>Recommended next steps and reflection prompts for continued growth.</p>'
      },
      fullContent: `
        <div class="insight-report">
          <h1>Insight Report - ${sessionData.circumstance || 'Session'}</h1>
          
          <section class="highlights">
            <h2>✨ Highlights & Breakthroughs</h2>
            <div><p>Key highlights from your session about ${sessionData.circumstance || 'your situation'}.</p></div>
          </section>
          
          <section class="patterns">
            <h2>🧠 Patterns & Mental Models</h2>
            <div><p>Mental patterns and models that emerged during our conversation.</p></div>
          </section>
          
          <section class="reframed-beliefs">
            <h2>💭 Reframed Beliefs & Insights</h2>
            <div><p>${sessionData.keyStatements?.reframedBelief || 'New perspectives and reframed beliefs developed.'}</p></div>
          </section>
          
          <section class="legacy-statement">
            <h2>🎯 Legacy Statement</h2>
            <div><p>${sessionData.keyStatements?.legacyStatement || 'Your personal legacy statement and core values.'}</p></div>
          </section>
          
          <section class="next-steps">
            <h2>🚀 Next Steps & Reflection Prompts</h2>
            <div><p>Recommended next steps and reflection prompts for continued growth.</p></div>
          </section>
        </div>
      `
    };
  }
}
