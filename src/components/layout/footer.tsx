import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Sprout } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 py-12 text-center">
      <div className="container mx-auto px-4">
        {/* Looking Ahead Section */}
        <div className="mb-8">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-green-800 flex items-center justify-center gap-2">
                <Sprout className="h-6 w-6" />
                🌱 Looking Ahead
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-700 space-y-4">
              <p>
                CognitiveInsight is currently a <strong>solo-led platform</strong> — designed, delivered, and supported by me, James Greenwood.
              </p>
              <p>
                As interest grows, I plan to <strong>build AI resources that are designed</strong> to help bring this protocol to larger communities, organizations, and leadership teams.
              </p>
              <p>
                For now, all consulting is <strong>one-on-one</strong>, and handcrafted to serve your individual clarity journey.
              </p>
              <p className="text-sm italic border-t border-green-300 pt-4">
                CognitiveInsight is part of the <strong>MyImaginaryFriends.ai</strong> vision — creating AI tools with soul, built for human growth and authentic connection.
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex flex-col items-center gap-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              &copy; 2025 CognitiveInsight. Built with Firebase Studio. Powered by Gemini AI.
            </p>
            <p className="text-sm text-muted-foreground">
              A project of <a href="https://www.MyImaginaryFriends.ai" className="underline hover:text-primary transition-colors">MyImaginaryFriends.ai</a>
            </p>
            <p className="text-sm text-muted-foreground italic">
              MyImaginaryFriends.ai — AI with soul, built for human growth.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
              <a href="https://www.MyImaginaryFriends.ai/terms-of-service" className="underline hover:text-primary transition-colors">Terms of Service & Privacy Policy</a>
              <span>|</span>
              <a href="https://www.MyImaginaryFriends.ai/responsible-ai" className="underline hover:text-primary transition-colors">Ethical Framework</a>
            </div>
          </div>
          <Button variant="outline" asChild size="sm" id="contact">
            <a href="mailto:founder@cognitiveinsight.ai" id="discovery">
              <Mail className="mr-2 h-4 w-4" />
              Contact the Founder
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
