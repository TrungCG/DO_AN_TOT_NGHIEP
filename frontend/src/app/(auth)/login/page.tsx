"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, CheckCircle2, Shield, Zap, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import { GoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authService } from "@/services/auth";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t, locale } = useI18n();

  const formSchema = z.object({
    username: z.string().min(1, t.auth.usernameRequired),
    password: z.string().min(1, t.auth.passwordRequired),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await authService.login(values);
      toast.success(t.auth.loginSuccess);
      router.push("/dashboard");
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : t.auth.loginFailed;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const features = [
    {
      icon: CheckCircle2,
      title: locale === "vi" ? "Quản lý công việc" : "Task Management",
      description: locale === "vi" ? "Theo dõi và quản lý mọi công việc" : "Track and manage all your tasks",
    },
    {
      icon: Shield,
      title: locale === "vi" ? "Bảo mật" : "Security",
      description: locale === "vi" ? "Dữ liệu được mã hóa an toàn" : "Your data is securely encrypted",
    },
    {
      icon: Zap,
      title: locale === "vi" ? "Nhanh chóng" : "Fast",
      description: locale === "vi" ? "Giao diện mượt mà, hiệu suất cao" : "Smooth interface, high performance",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FolderKanban className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CG SoftWare</h1>
              <p className="text-white/80 text-sm">Task Manager</p>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              {t.auth.manageTasksEfficiently}
            </h2>
            <p className="text-white/80 mt-4 text-lg">
              {locale === "vi" 
                ? "Nền tảng quản lý công việc toàn diện cho đội nhóm hiện đại" 
                : "A comprehensive task management platform for modern teams"}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-white/60 text-sm">
            © 2024 CG SoftWare. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-950 relative">
        {/* Language Toggle */}
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <FolderKanban className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">CG SoftWare</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Task Manager</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t.auth.loginTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t.auth.loginSubtitle}
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.username}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t.auth.usernamePlaceholder}
                        className="h-12 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.password}</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium"
                      >
                        {t.auth.forgotPassword}
                      </Link>
                    </div>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t.auth.passwordPlaceholder}
                        className="h-12 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/25" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t.auth.loginButton}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 dark:bg-slate-950 px-3 text-gray-500 dark:text-gray-400">
                    {t.auth.orContinueWith}
                  </span>
                </div>
              </div>

              {/* Google Login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setIsLoading(true);
                      const idToken = credentialResponse.credential;
                      if (!idToken) {
                        toast.error(locale === "vi" ? "Không thể lấy token từ Google" : "Could not retrieve token from Google");
                        return;
                      }
                      await authService.googleLogin(idToken);
                      toast.success(t.auth.loginSuccess);
                      router.push("/dashboard");
                    } catch (error: unknown) {
                      console.error(error);
                      toast.error(locale === "vi" ? "Đăng nhập Google thất bại" : "Google login failed");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onError={() => {
                    toast.error(locale === "vi" ? "Đăng nhập Google thất bại" : "Google login failed");
                  }}
                  theme="outline"
                  size="large"
                />
              </div>

              {/* Sign up link */}
              <div className="text-center pt-4">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.auth.noAccount}{" "}
                </span>
                <Link
                  href="/signup"
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold"
                >
                  {t.auth.signupNow}
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
