"use client";

import { MOCK_USERS } from "@/data/mock-users";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AuthField,
  AuthInputWrap,
  AuthSubmitButton,
  authInputClass,
} from "./auth-fields";

const loginSchema = z.object({
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

type LoginInput = z.infer<typeof loginSchema>;

const DEMO_PASSWORD = "SuperAdmin123!";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      remember: true,
      email: "superadmin@claimora.local",
      password: DEMO_PASSWORD,
    },
  });

  const fillDemo = (email: string) => {
    setAuthError(null);
    setValue("email", email, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(async (values) => {
        setAuthError(null);
        const result = await login(values.email, values.password);
        if (!result.ok) {
          setAuthError(result.message);
          return;
        }
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
      })}
    >
      {authError && (
        <div
          className="flex gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 dark:border-red-900 dark:bg-red-950/50"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Sign in failed</p>
            <p className="mt-0.5 text-xs text-red-700 dark:text-red-400">{authError}</p>
          </div>
        </div>
      )}

      <AuthField label="Work email" error={errors.email?.message}>
        <AuthInputWrap icon={<Mail className="size-4" />}>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            className={cn(authInputClass, "pl-10")}
            placeholder="name@insurance.co.id"
          />
        </AuthInputWrap>
      </AuthField>

      <AuthField label="Password" error={errors.password?.message}>
        <AuthInputWrap icon={<Lock className="size-4" />}>
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className={cn(authInputClass, "pl-10 pr-10")}
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </AuthInputWrap>
      </AuthField>

      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <input
            type="checkbox"
            {...register("remember")}
            className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
<<<<<<< HEAD
          className="text-sm font-medium text-primary transition-colors hover:text-primary-dark dark:text-primary dark:hover:text-primary"
=======
          className="text-sm font-medium text-primary transition-colors hover:text-primary-hover dark:text-primary dark:hover:text-primary-hover"
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
        >
          Forgot password?
        </Link>
      </div>

      <AuthSubmitButton loading={isSubmitting}>Sign in to workspace</AuthSubmitButton>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <p className="relative mx-auto w-fit bg-white px-3 text-xs font-medium uppercase tracking-wider text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          Demo access
        </p>
      </div>

      <div className="grid gap-2">
        {MOCK_USERS.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => fillDemo(user.email)}
<<<<<<< HEAD
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary-50/50 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary/40 dark:hover:bg-primary/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-xs font-semibold text-white">
=======
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-primary/40 dark:hover:bg-primary/10"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-hover text-xs font-semibold text-white">
>>>>>>> 6791d5af7a697dabd3706cb36796d0d203378ff5
              {user.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
            </span>
            <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700">
              {user.role}
            </span>
          </button>
        ))}
      </div>

    </form>
  );
}
