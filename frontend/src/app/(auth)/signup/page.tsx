"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Users, Sparkles, Globe, FolderKanban } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t, locale } = useI18n();

  const formSchema = z
    .object({
      first_name: z.string().min(1, t.auth.firstNameRequired),
      last_name: z.string().min(1, t.auth.lastNameRequired),
      username: z.string().min(3, t.auth.usernameMin),
      email: z.string().email(t.auth.emailInvalid),
      password: z.string().min(8, t.auth.passwordMin),
      confirm_password: z.string().min(8, t.auth.passwordRequired),
    })
    .refine((data) => data.password === data.confirm_password, {
      message: t.auth.passwordMismatch,
      path: ["confirm_password"],
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await authService.signup(values);
      toast.success(t.auth.signupSuccess);
      router.push("/login");
    } catch (error: unknown) {
      console.error(error);
      toast.error(t.auth.signupFailed);
    } finally {
      setIsLoading(false);
    }
  }

  const features = [
    {
      icon: Users,
      title: locale === "vi" ? "Làm việc nhóm" : "Team Collaboration",
      description: locale === "vi" ? "Phối hợp hiệu quả với đội nhóm" : "Collaborate effectively with your team",
    },
    {
      icon: Sparkles,
      title: locale === "vi" ? "Giao diện hiện đại" : "Modern Interface",
      description: locale === "vi" ? "Trải nghiệm người dùng tuyệt vời" : "Excellent user experience",
    },
    {
      icon: Globe,
      title: locale === "vi" ? "Truy cập mọi nơi" : "Access Anywhere",
      description: locale === "vi" ? "Làm việc từ bất kỳ đâu" : "Work from anywhere",
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
              {t.auth.createAccount}
            </h2>
            <p className="text-white/80 mt-4 text-lg">
              {locale === "vi" 
                ? "Tham gia cùng hàng nghìn người dùng đang quản lý công việc hiệu quả" 
                : "Join thousands of users managing tasks effectively"}
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
            © 2026 CG SoftWare. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
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
              {t.auth.signupTitle}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {t.auth.signupSubtitle}
            </p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.firstName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t.auth.firstNamePlaceholder}
                          className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.lastName}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={t.auth.lastNamePlaceholder}
                          className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.username}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t.auth.usernamePlaceholder}
                        className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.email}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t.auth.emailPlaceholder}
                        className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
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
                    <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.password}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t.auth.passwordPlaceholder}
                        className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">{t.auth.confirmPassword}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={t.auth.confirmPasswordPlaceholder}
                        className="h-11 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold shadow-lg shadow-teal-500/25 mt-2" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t.auth.signupButton}
              </Button>

              {/* Login link */}
              <div className="text-center pt-4">
                <span className="text-gray-500 dark:text-gray-400">
                  {t.auth.haveAccount}{" "}
                </span>
                <Link
                  href="/login"
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-semibold"
                >
                  {t.auth.loginNow}
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
