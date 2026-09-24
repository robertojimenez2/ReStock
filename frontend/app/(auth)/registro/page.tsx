"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth/use-auth";

const schema = z.object({
  company: z.object({
    name: z.string().min(2, "Mínimo 2 caracteres").max(150),
    legal_name: z.string().min(2, "Mínimo 2 caracteres").max(150),
    industry: z.string().min(2, "Mínimo 2 caracteres").max(100),
    description: z.string().max(250).optional().or(z.literal("")),
    city: z.string().min(2, "Mínimo 2 caracteres").max(100),
    state: z.string().min(2, "Mínimo 2 caracteres").max(100),
    address: z.string().max(250).optional().or(z.literal("")),
  }),
  user: z.object({
    email: z.string().email("Correo inválido"),
    full_name: z.string().min(2, "Mínimo 2 caracteres").max(150),
    password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  }),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: {
        name: "",
        legal_name: "",
        industry: "",
        description: "",
        city: "",
        state: "",
        address: "",
      },
      user: {
        email: "",
        full_name: "",
        password: "",
      },
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await registerUser({
        company: {
          name: values.company.name,
          legal_name: values.company.legal_name,
          industry: values.company.industry,
          description: values.company.description || undefined,
          city: values.company.city,
          state: values.company.state,
          address: values.company.address || undefined,
        },
        user: values.user,
      });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.detail);
      } else {
        setServerError("No se pudo conectar con el servidor");
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear cuenta</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Datos de la empresa
            </h3>

            <Input
              label="Nombre comercial"
              placeholder="Plásticos del Centro"
              error={errors.company?.name?.message}
              {...register("company.name")}
            />

            <Input
              label="Razón social"
              placeholder="Plásticos del Centro SA de CV"
              error={errors.company?.legal_name?.message}
              {...register("company.legal_name")}
            />

            <Input
              label="Industria"
              placeholder="Manufactura de plásticos"
              error={errors.company?.industry?.message}
              {...register("company.industry")}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ciudad"
                placeholder="Guadalajara"
                error={errors.company?.city?.message}
                {...register("company.city")}
              />
              <Input
                label="Estado"
                placeholder="Jalisco"
                error={errors.company?.state?.message}
                {...register("company.state")}
              />
            </div>

            <Input
              label="Dirección (opcional)"
              placeholder="Av. Industrial 123"
              error={errors.company?.address?.message}
              {...register("company.address")}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Datos del administrador
            </h3>

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="admin@empresa.mx"
              autoComplete="email"
              error={errors.user?.email?.message}
              {...register("user.email")}
            />

            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.user?.full_name?.message}
              {...register("user.full_name")}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              error={errors.user?.password?.message}
              {...register("user.password")}
            />
          </section>

          {serverError && (
            <div className="rounded-md bg-danger-50 border border-danger-500/20 px-3 py-2 text-sm text-danger-700 dark:bg-danger-500/10 dark:text-danger-500 dark:border-danger-500/30">
              {serverError}
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Crear cuenta
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary-500 hover:text-primary-600"
          >
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}