// RegisterForm — sign-up form for new users.
// Collects first name, last name, email, and password (confirmed twice).
// Validates with Zod, creates a Supabase auth user, and inserts a profiles row.
// Stores first_name and last_name in both user_metadata and the profiles table.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        // Store names in user_metadata as a fallback if profiles table isn't queried.
        data: {
          first_name: values.firstName,
          last_name: values.lastName,
        },
      },
    });

    if (signUpError) {
      setServerError(signUpError.message);
      return;
    }

    if (data.user) {
      // Insert into profiles table. If this fails, the user still has an auth account
      // and their name is available via user_metadata — not a blocking error.
      await supabase.from("profiles").insert({
        id: data.user.id,
        first_name: values.firstName,
        last_name: values.lastName,
      });
    }

    router.push("/interview");
    router.refresh();
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-xl shadow-black/10 p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start practicing interviews for free.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* First / Last name row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Leo"
              {...register("firstName")}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg bg-input border text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent",
                "transition-colors",
                errors.firstName ? "border-red-500" : "border-border"
              )}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              placeholder="Zheng"
              {...register("lastName")}
              className={cn(
                "w-full px-3.5 py-2.5 rounded-lg bg-input border text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent",
                "transition-colors",
                errors.lastName ? "border-red-500" : "border-border"
              )}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            className={cn(
              "w-full px-3.5 py-2.5 rounded-lg bg-input border text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent",
              "transition-colors",
              errors.email ? "border-red-500" : "border-border"
            )}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              {...register("password")}
              className={cn(
                "w-full px-3.5 py-2.5 pr-10 rounded-lg bg-input border text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent",
                "transition-colors",
                errors.password ? "border-red-500" : "border-border"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="confirmPassword">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              {...register("confirmPassword")}
              className={cn(
                "w-full px-3.5 py-2.5 pr-10 rounded-lg bg-input border text-sm",
                "placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent",
                "transition-colors",
                errors.confirmPassword ? "border-red-500" : "border-border"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Server-level error */}
        {serverError && (
          <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {serverError}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 mt-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      <p className="text-sm text-center text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
