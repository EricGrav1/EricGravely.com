import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Unsubscribe() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const email = params.get("email");
  const token = params.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Please check your email for the correct link.");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "You have been successfully unsubscribed.");
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to unsubscribe. Please try again.");
        }
      } catch {
        setStatus("error");
        setMessage("An error occurred. Please try again later.");
      }
    };

    unsubscribe();
  }, [email, token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <>
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3" data-testid="text-processing-headline">
              Processing...
            </h1>
            <p className="text-muted-foreground" data-testid="text-processing-message">
              Please wait while we update your preferences.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3" data-testid="text-unsubscribe-headline">
              You're Unsubscribed
            </h1>
            <p className="text-muted-foreground mb-6" data-testid="text-unsubscribe-message">
              {message}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-unsubscribe-note">
              We're sorry to see you go. You won't receive any more emails from us.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3" data-testid="text-error-headline">
              Something Went Wrong
            </h1>
            <p className="text-muted-foreground mb-6" data-testid="text-error-message">
              {message}
            </p>
            <Button asChild variant="outline" data-testid="button-back-home">
              <a href="/">
                <Mail className="w-4 h-4 mr-2" />
                Back to Home
              </a>
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
