"use client";

import { Building2, MapPin, Pencil } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CompanyForm, type CompanyFormValues } from "@/components/company/company-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, companiesApi, type Company } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";
import { formatRelativeTime } from "@/lib/format";

export default function MyCompanyPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await companiesApi.getMy();
      setCompany(data);
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail);
      else setError("No se pudo cargar la empresa");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (values: CompanyFormValues) => {
    const updated = await companiesApi.updateMy({
      name: values.name,
      legal_name: values.legal_name,
      industry: values.industry,
      description: values.description || null,
      city: values.city,
      state: values.state,
      address: values.address || null,
    });
    setCompany(updated);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-danger-500/30 bg-danger-50 p-6 dark:bg-danger-500/10">
          <p className="text-sm text-danger-700 dark:text-danger-500">
            {error ?? "Empresa no encontrada"}
          </p>
          <Button variant="ghost" size="sm" onClick={load} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin =
    user?.role === "platform_admin" || user?.role === "company_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-neutral-400" />
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {company.name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {company.legal_name}
          </p>
        </div>

        {isAdmin && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Editar empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm
              company={company}
              onSubmit={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información comercial</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <Row label="Industria" value={company.industry} />
                  {company.description && (
                    <Row label="Descripción" value={company.description} />
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ubicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p>
                      {company.city}, {company.state}
                    </p>
                    {company.address && (
                      <p className="mt-1 text-xs text-neutral-500">
                        {company.address}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-neutral-500">
                  Registrada {formatRelativeTime(company.created_at)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </dt>
      <dd className="text-neutral-900 dark:text-neutral-100">{value}</dd>
    </div>
  );
}