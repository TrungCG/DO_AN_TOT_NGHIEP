"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Lock, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authService } from "@/services/auth";
import { userService } from "@/services/user";
import { useI18n } from "@/lib/i18n";
import { User } from "@/types/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  // Change Password States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error(t.profile.fillAllFields);
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t.profile.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.profile.passwordMismatch);
      return;
    }

    setIsLoading(true);

    try {
      await authService.setPassword(newPassword, confirmPassword);
      toast.success(t.profile.passwordChanged);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error(error);
      const errorData = (
        error as {
          response?: {
            data?: {
              new_password?: string[];
              confirm_password?: string[];
              detail?: string;
            };
          };
        }
      ).response?.data;
      const errorMessage =
        errorData?.new_password?.[0] ||
        errorData?.confirm_password?.[0] ||
        errorData?.detail ||
        t.profile.passwordChangeFailed;
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            className="mb-4 pl-0"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t.profile.backToDashboard}
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{t.profile.title}</h1>
          <p className="text-muted-foreground mt-2">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                {t.profile.accountInfo}
              </CardTitle>
              <CardDescription>
                {t.profile.accountInfoDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t.profile.username}
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {user?.username || "..."}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">{t.profile.email}</Label>
                  <p className="text-sm font-medium mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email || "..."}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  {t.profile.contactAdmin}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t.profile.changePassword}
              </CardTitle>
              <CardDescription>
                {t.profile.changePasswordDesc}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t.profile.newPassword}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder={t.profile.newPasswordPlaceholder}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t.profile.confirmPassword}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t.profile.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    minLength={8}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t.profile.processing : t.profile.changePasswordBtn}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    disabled={isLoading}
                  >
                    {t.profile.cancel}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                💡 {t.profile.securityTips}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>{t.profile.tip1}</li>
                <li>{t.profile.tip2}</li>
                <li>{t.profile.tip3}</li>
                <li>{t.profile.tip4}</li>
                <li>{t.profile.tip5}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
