import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Pencil, Eye, TrendingUp, Users, ToggleLeft, ToggleRight,
  BarChart2, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { insertLeadMagnetSchema, type LeadMagnet, type InsertLeadMagnet } from "@shared/schema";
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

function LeadMagnetForm({
  defaultValues,
  onSuccess,
  onCancel,
  isEditing,
  editId,
}: {
  defaultValues?: Partial<InsertLeadMagnet>;
  onSuccess: () => void;
  onCancel: () => void;
  isEditing: boolean;
  editId?: number;
}) {
  const form = useForm<InsertLeadMagnet>({
    resolver: zodResolver(insertLeadMagnetSchema),
    defaultValues: {
      title: "",
      description: "",
      resourceUrl: "",
      deliveryMethod: "email",
      active: true,
      ...defaultValues,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLeadMagnet) => {
      const res = await apiRequest("POST", "/api/admin/lead-magnets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
      onSuccess();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertLeadMagnet>) => {
      const res = await apiRequest("PATCH", `/api/admin/lead-magnets/${editId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
      onSuccess();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  const onSubmit = (data: InsertLeadMagnet) => {
    if (isEditing && editId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> {isEditing ? "Save Changes" : "Add Resource"}</>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} data-testid="button-cancel-form">
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

        {/* Header */}
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

        {/* Summary Stats */}
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

        {/* Analytics Table */}
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

        {/* Resource Management */}
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {magnets.map((magnet) => (
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
                      <Badge variant="outline" className="capitalize">
                        {magnet.deliveryMethod}
                      </Badge>
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
                ))}
                {magnets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No resources yet. Click "Add Resource" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {/* Add / Edit Sheet */}
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
