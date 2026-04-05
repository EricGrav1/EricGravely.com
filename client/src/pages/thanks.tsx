import { CheckCircle2, Smartphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearch } from "wouter";

const APP_STORE_URL = "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";

export default function Thanks() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const resourceName = params.get("resource") || "your resource";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <Card className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-testid="text-success-headline"
          >
            Check Your Email!
          </h1>

          <p
            className="text-lg text-muted-foreground mb-10"
            data-testid="text-success-message"
          >
            <strong className="text-foreground">{resourceName}</strong> is on its way to your inbox. Check your email (and spam folder) for the download link.
          </p>

          <div className="space-y-4">
            <Button
              asChild
              size="lg"
              className="w-full font-semibold"
              data-testid="button-get-app"
            >
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <Smartphone className="w-5 h-5 mr-2" />
                Get the App
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full"
              data-testid="button-get-more"
            >
              <a href="/">
                Browse More Free Resources
              </a>
            </Button>
          </div>

          <div className="mt-10 pt-8 border-t border-border">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>Didn't receive it? Check your spam folder.</span>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Transform your sales conversations with AI-powered coaching
        </p>
      </div>
    </div>
  );
}
