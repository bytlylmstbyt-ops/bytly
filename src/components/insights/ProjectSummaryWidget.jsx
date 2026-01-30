import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Copy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function ProjectSummaryWidget({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateSummary();
  }, [projectId]);

  const generateSummary = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke("generateProjectSummary", {
        project_id: projectId
      });
      
      if (response.data.success) {
        setSummary(response.data.summary);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary);
      toast.success("تم نسخ الملخص");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">لم يتمكن من توليد الملخص</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ملخص تحديث المشروع</CardTitle>
          <CardDescription>ملخص شخصي مولد بـ AI للعميل</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={copySummary}
            className="gap-2"
          >
            <Copy className="w-4 h-4" />
            نسخ
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={generateSummary}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-slate-700 text-sm leading-relaxed">
            {summary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}