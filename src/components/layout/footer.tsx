import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/95 py-12 text-center">
      <div className="container mx-auto px-4">
        
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
