import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Eye, TrendingUp, Users, ToggleLeft, ToggleRight,
  BarChart2, Loader2, CheckCircle2, Trash2, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  insertLeadMagnetSchema,
  type LeadMagnet,
  type InsertLeadMagnet,
  type QuestionnaireField,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AnalyticsStat {
  id: number;
  title: string;
  viewCount: number;
  submissionCount: number;
  conversionRate: number;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </Card>
  );
}

type FormValues = InsertLeadMagnet & {
  questionnaireFields: QuestionnaireField[];
};

function LeadMagnetForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditing,
  editId,
}: {
  defaultValues?: Partial<FormValues>;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing: boolean;
  editId?: number;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(insertLeadMagnetSchema),
    defaultValues: {
      title: "",
      description: "",
      resourceUrl: "",
      deliveryMethod: "email",
      active: true,
      nextSteps: "",
      questionnaireFields: [],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questionnaireFields",
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/admin/lead-magnets", data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); onSuccess(); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FormValues>) => {
      const res = await apiRequest("PATCH", `/api/admin/lead-magnets/${editId}`, data);
      return res.json();
    },
    onSuccess: () => { invalidateAll(); onSuccess(); },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const onSubmit = (data: FormValues) => {
    const payload = {
      ...data,
      questionnaireFields: data.questionnaireFields?.length ? data.questionnaireFields : undefined,
      nextSteps: data.nextSteps?.trim() || undefined,
    };
    if (isEditing && editId) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const addField = () => {
    append({ id: `field_${Date.now()}`, label: "", required: false });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Self Coaching Matrix" data-testid="input-title" disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="A brief description shown to visitors..."
                  rows={3}
                  data-testid="input-description"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resourceUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="url"
                  placeholder="https://..."
                  data-testid="input-resource-url"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deliveryMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                <FormControl>
                  <SelectTrigger data-testid="select-delivery-method">
                    <SelectValue placeholder="Select delivery method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="download">Direct Download</SelectItem>
                  <SelectItem value="both">Email + Download</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nextSteps"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Next steps{" "}
                <span className="text-muted-foreground font-normal">(shown on thank-you page)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={"1. Open the PDF\n2. Work through Section 1 first\n3. Book a free coaching call..."}
                  rows={3}
                  data-testid="input-next-steps"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-foreground">Questionnaire fields</p>
              <p className="text-xs text-muted-foreground">Optional questions shown in the contact form</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addField}
              disabled={isPending}
              data-testid="button-add-field"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add field
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
              No questionnaire fields. Click "Add field" to collect extra info from leads.
            </p>
          )}

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30"
                data-testid={`field-row-${index}`}
              >
                <GripVertical className="w-4 h-4 mt-2 text-muted-foreground shrink-0" />
                <div className="flex-1 space-y-2">
                  <FormField
                    control={form.control}
                    name={`questionnaireFields.${index}.label`}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...f}
                            placeholder="e.g. What is your biggest sales challenge?"
                            className="text-sm"
                            disabled={isPending}
                            data-testid={`input-field-label-${index}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`questionnaireFields.${index}.required`}
                    render={({ field: f }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={f.value}
                            onCheckedChange={f.onChange}
                            disabled={isPending}
                            data-testid={`checkbox-field-required-${index}`}
                          />
                        </FormControl>
                        <FormLabel className="text-xs font-normal text-muted-foreground cursor-pointer">
                          Required
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(index)}
                  disabled={isPending}
                  data-testid={`button-remove-field-${index}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{(error as Error).message}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            className="flex-1"
            disabled={isPending}
            data-testid="button-save-resource"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />{isEditing ? "Save Changes" : "Add Resource"}</>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            data-testid="button-cancel-form"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Admin() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMagnet, setEditingMagnet] = useState<LeadMagnet | null>(null);

  const { data: magnets = [], isLoading: magnetsLoading } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/admin/lead-magnets"],
  });

  const { data: analytics = [], isLoading: analyticsLoading } = useQuery<AnalyticsStat[]>({
    queryKey: ["/api/analytics"],
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/lead-magnets/${id}`, { active });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
    },
  });

  const totalViews = analytics.reduce((s, a) => s + a.viewCount, 0);
  const totalSubmissions = analytics.reduce((s, a) => s + a.submissionCount, 0);
  const overallConversion = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;

  const openAdd = () => {
    setEditingMagnet(null);
    setSheetOpen(true);
  };

  const openEdit = (magnet: LeadMagnet) => {
    setEditingMagnet(magnet);
    setSheetOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-headline">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Manage your free resources and track performance.</p>
          </div>
          <Button onClick={openAdd} data-testid="button-add-resource">
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <StatCard
            icon={Eye}
            label="Total Views"
            value={analyticsLoading ? "—" : totalViews.toLocaleString()}
            color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          />
          <StatCard
            icon={Users}
            label="Total Leads"
            value={analyticsLoading ? "—" : totalSubmissions.toLocaleString()}
            color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
          />
          <StatCard
            icon={TrendingUp}
            label="Overall Conversion"
            value={analyticsLoading ? "—" : `${overallConversion}%`}
            color="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
          />
        </div>

        <Card className="mb-10 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <BarChart2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Performance by Resource</h2>
          </div>
          {analyticsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading analytics...
            </div>
          ) : (
            <Table data-testid="table-analytics">
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.map((stat) => (
                  <TableRow key={stat.id} data-testid={`row-analytics-${stat.id}`}>
                    <TableCell className="font-medium">{stat.title}</TableCell>
                    <TableCell className="text-right">{stat.viewCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{stat.submissionCount.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={stat.conversionRate > 20 ? "default" : stat.conversionRate > 5 ? "secondary" : "outline"}
                        data-testid={`badge-conversion-${stat.id}`}
                      >
                        {stat.conversionRate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {analytics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No data yet. Add resources and share your page to start tracking.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Resources</h2>
          </div>
          {magnetsLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading resources...
            </div>
          ) : (
            <Table data-testid="table-resources">
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {magnets.map((magnet) => {
                  const qFields = (magnet.questionnaireFields as QuestionnaireField[] | null) ?? [];
                  return (
                    <TableRow key={magnet.id} data-testid={`row-resource-${magnet.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{magnet.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {magnet.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{magnet.deliveryMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {qFields.length > 0 ? `${qFields.length} question${qFields.length > 1 ? "s" : ""}` : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={magnet.active ? "default" : "secondary"} data-testid={`badge-status-${magnet.id}`}>
                          {magnet.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(magnet)}
                            data-testid={`button-edit-${magnet.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMutation.mutate({ id: magnet.id, active: !magnet.active })}
                            disabled={toggleMutation.isPending}
                            data-testid={`button-toggle-${magnet.id}`}
                            title={magnet.active ? "Deactivate" : "Activate"}
                          >
                            {magnet.active
                              ? <ToggleRight className="w-5 h-5 text-green-600" />
                              : <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                            }
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {magnets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No resources yet. Click "Add Resource" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingMagnet ? "Edit Resource" : "Add New Resource"}</SheetTitle>
            <SheetDescription>
              {editingMagnet
                ? "Update the details for this free resource."
                : "Add a new free resource to your lead magnet library."}
            </SheetDescription>
          </SheetHeader>
          <LeadMagnetForm
            key={editingMagnet?.id ?? "new"}
            defaultValues={editingMagnet ? {
              title: editingMagnet.title,
              description: editingMagnet.description,
              resourceUrl: editingMagnet.resourceUrl ?? "",
              deliveryMethod: editingMagnet.deliveryMethod,
              active: editingMagnet.active,
              nextSteps: editingMagnet.nextSteps ?? "",
              questionnaireFields: ((editingMagnet.questionnaireFields as QuestionnaireField[] | null) ?? []),
            } : undefined}
            isEditing={!!editingMagnet}
            editId={editingMagnet?.id}
            onSuccess={() => setSheetOpen(false)}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
