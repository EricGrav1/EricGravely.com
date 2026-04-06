import { CheckCircle2, Smartphone, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { type LeadMagnet } from "@shared/schema";

const APP_STORE_URL = "https://apps.apple.com/us/app/sales-coach-ai/id6748286535";

export default function Thanks() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const resourceId = params.get("resourceId");

  const { data: magnets = [] } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/lead-magnets"],
  });

  const resource = resourceId
    ? magnets.find((m) => m.id === parseInt(resourceId, 10))
    : undefined;

  const resourceName = resource?.title ?? "your resource";
  const resourceDesc = resource?.description ?? "";
  const nextSteps = resource?.nextSteps ?? null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        <Card className="p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-foreground" />
          </div>

          <h1
            className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4"
            data-testid="text-success-headline"
          >
            Check Your Email!
          </h1>

          <p
            className="text-lg text-muted-foreground mb-3"
            data-testid="text-success-message"
          >
            <strong className="text-foreground">{resourceName}</strong> is on its way to your inbox.
          </p>

          {resourceDesc && (
            <p className="text-sm text-muted-foreground mb-8" data-testid="text-resource-description">
              {resourceDesc}
            </p>
          )}

          {nextSteps && (
            <div
              className="bg-muted/50 rounded-xl p-5 text-left mb-8"
              data-testid="section-next-steps"
            >
              <h2 className="font-semibold text-foreground text-sm mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Next steps
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{nextSteps}</p>
            </div>
          )}

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
