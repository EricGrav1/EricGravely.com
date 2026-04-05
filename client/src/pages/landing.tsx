import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Mail, Lock, Loader2, CheckCircle2, Phone, ArrowLeft,
  BookOpen, FileText, BarChart2, Lightbulb, Star, Gift, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  insertLeadSchema,
  type InsertLead,
  type LeadMagnet,
  type QuestionnaireField,
} from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

const ICONS = [BookOpen, FileText, BarChart2, Lightbulb, Star, Gift];
const ICON_COLORS = [
  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
];

function getIcon(id: number) {
  return ICONS[(id - 1) % ICONS.length];
}
function getColor(id: number) {
  return ICON_COLORS[(id - 1) % ICON_COLORS.length];
}

function ResourceCard({
  magnet,
  onSelect,
  onViewed,
}: {
  magnet: LeadMagnet;
  onSelect: (m: LeadMagnet) => void;
  onViewed: (id: number) => void;
}) {
  const Icon = getIcon(magnet.id);
  const colorClass = getColor(magnet.id);
  const fields = (magnet.questionnaireFields as QuestionnaireField[] | null) ?? [];

  useEffect(() => {
    onViewed(magnet.id);
  }, [magnet.id]);

  return (
    <Card
      className="p-6 flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:border-ring/50 transition-all duration-200 group"
      data-testid={`card-resource-${magnet.id}`}
      onClick={() => onSelect(magnet)}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-lg leading-snug mb-2 group-hover:text-ring transition-colors">
          {magnet.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {magnet.description}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">Free</Badge>
          {fields.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              Quick questions
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-ring opacity-0 group-hover:opacity-100 transition-opacity">
          Get it →
        </span>
      </div>
    </Card>
  );
}

function buildDynamicSchema(fields: QuestionnaireField[]) {
  const base = insertLeadSchema;
  if (fields.length === 0) return base;
  const answers: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    answers[f.id] = f.required
      ? z.string().min(1, `${f.label} is required`)
      : z.string().optional();
  }
  return base.extend({ questionnaireAnswers: z.object(answers).optional() });
}

export default function Landing() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"select" | "form">("select");
  const [selectedMagnet, setSelectedMagnet] = useState<LeadMagnet | null>(null);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const viewedIds = useRef<Set<number>>(new Set());

  const { data: magnets = [], isLoading } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/lead-magnets"],
  });

  const questionnaireFields: QuestionnaireField[] = selectedMagnet
    ? ((selectedMagnet.questionnaireFields as QuestionnaireField[] | null) ?? [])
    : [];

  const dynamicSchema = buildDynamicSchema(questionnaireFields);

  const form = useForm<InsertLead>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      email: "",
      phone: "",
      leadMagnetId: 0,
      questionnaireAnswers: {},
    },
  });

  const handleViewed = (id: number) => {
    if (viewedIds.current.has(id)) return;
    viewedIds.current.add(id);
    fetch(`/api/lead-magnets/${id}/view`, { method: "POST" }).catch(() => {});
  };

  const handleSelect = (magnet: LeadMagnet) => {
    setSelectedMagnet(magnet);
    form.reset({
      email: "",
      phone: "",
      leadMagnetId: magnet.id,
      questionnaireAnswers: {},
    });
    setStep("form");
  };

  const submitMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      const response = await apiRequest("POST", "/api/lead", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.unsubscribed) {
        setIsUnsubscribed(true);
      } else {
        setLocation(`/thanks?resourceId=${selectedMagnet?.id ?? ""}`);
      }
    },
    onError: (error: Error) => {
      form.setError("email", { message: error.message });
    },
  });

  const onSubmit = (data: InsertLead) => {
    submitMutation.mutate({
      ...data,
      phone: data.phone?.trim() || undefined,
    });
  };

  if (isUnsubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">You're Unsubscribed</h1>
          <p className="text-muted-foreground">
            This email address has been unsubscribed. To receive a resource, please use a different email address.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">

        {step === "select" && (
          <>
            <div className="text-center mb-12">
              <h1
                className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
                data-testid="text-hero-headline"
              >
                Free Resources for Sales Professionals
              </h1>
              <p
                className="text-xl text-muted-foreground max-w-xl mx-auto"
                data-testid="text-hero-subheadline"
              >
                Pick a free resource below and we'll send it straight to your inbox.
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 animate-pulse">
                    <div className="w-12 h-12 rounded-xl bg-muted mb-4" />
                    <div className="h-5 bg-muted rounded w-3/4 mb-3" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                  </Card>
                ))}
              </div>
            ) : magnets.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                No resources available right now. Check back soon.
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-testid="grid-resources"
              >
                {magnets.map((magnet) => (
                  <ResourceCard
                    key={magnet.id}
                    magnet={magnet}
                    onSelect={handleSelect}
                    onViewed={handleViewed}
                  />
                ))}
              </div>
            )}

            <div className="mt-12 text-center text-sm text-muted-foreground">
              All resources are 100% free — no credit card required.
            </div>
          </>
        )}

        {step === "form" && selectedMagnet && (
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setStep("select")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to resources
            </button>

            <div className="text-center mb-10">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${getColor(selectedMagnet.id)}`}>
                {(() => { const Icon = getIcon(selectedMagnet.id); return <Icon className="w-8 h-8" />; })()}
              </div>
              <h1
                className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3"
                data-testid="text-form-headline"
              >
                Get {selectedMagnet.title}
              </h1>
              <p className="text-muted-foreground text-lg" data-testid="text-form-description">
                {selectedMagnet.description}
              </p>
            </div>

            <Card className="p-8 shadow-lg">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="you@example.com"
                              className="pl-12 text-base border-2 focus:border-ring"
                              disabled={submitMutation.isPending}
                              data-testid="input-email"
                            />
                            {form.formState.dirtyFields.email && !form.formState.errors.email && field.value && (
                              <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone number{" "}
                          <span className="text-muted-foreground font-normal">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              {...field}
                              type="tel"
                              placeholder="+1 (555) 000-0000"
                              className="pl-12 text-base border-2 focus:border-ring"
                              disabled={submitMutation.isPending}
                              data-testid="input-phone"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Dynamic questionnaire fields */}
                  {questionnaireFields.length > 0 && (
                    <div className="border-t border-border pt-5 space-y-4">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        A few quick questions
                      </p>
                      {questionnaireFields.map((qf) => (
                        <FormField
                          key={qf.id}
                          control={form.control}
                          name={`questionnaireAnswers.${qf.id}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {qf.label}
                                {!qf.required && (
                                  <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                )}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value ?? ""}
                                  placeholder={`Your answer...`}
                                  className="text-base border-2 focus:border-ring"
                                  disabled={submitMutation.isPending}
                                  data-testid={`input-questionnaire-${qf.id}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-semibold"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</>
                    ) : (
                      `Send Me ${selectedMagnet.title}`
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p data-testid="text-consent">
                  We'll email you the resource and occasional follow-ups. Unsubscribe anytime.
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
