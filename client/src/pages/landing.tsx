import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Mail, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      email: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const response = await apiRequest("POST", "/api/lead", data);
      return response;
    },
    onSuccess: (data: any) => {
      if (data.unsubscribed) {
        setIsUnsubscribed(true);
      } else {
        setLocation("/thanks");
      }
    },
    onError: (error: Error) => {
      form.setError("email", { message: error.message });
    },
  });

  const onSubmit = (data: InsertLead) => {
    submitMutation.mutate(data);
  };

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            You're Unsubscribed
          </h1>
          <p className="text-muted-foreground">
            This email address has been unsubscribed from our list. If you'd like to receive the Self Coaching Matrix, please use a different email address.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-12">
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight" data-testid="text-hero-headline">
            Get the Self Coaching Matrix
            <span className="text-muted-foreground"> (PDF)</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground" data-testid="text-hero-subheadline">
            Enter your email and I'll send it instantly.
          </p>
        </div>

        <Card className="p-8 md:p-10 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className="pl-12 text-base border-2 focus:border-ring focus:ring-2 focus:ring-ring/20"
                          disabled={submitMutation.isPending}
                          data-testid="input-email"
                        />
                        {form.formState.isValid && field.value && (
                          <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                size="lg"
                className="w-full font-semibold"
                disabled={submitMutation.isPending}
                data-testid="button-submit"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Me The Matrix"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p data-testid="text-consent">
              You'll receive the PDF + occasional follow-ups. Unsubscribe anytime.
            </p>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Transform your sales conversations with proven coaching frameworks
          </p>
        </div>
      </div>
    </div>
  );
}
