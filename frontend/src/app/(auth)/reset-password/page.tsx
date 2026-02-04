"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, Loader2 } from "lucide-react";
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
import { authService } from "@/services/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Token không hợp lệ hoặc đã hết hạn.");
      router.push("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!token) {
      toast.error("Token không hợp lệ.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, newPassword, confirmPassword);
      setResetSuccess(true);
      toast.success("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      console.error(error);
      const errorData = (
        error as {
          response?: {
            data?: {
              token?: string[];
              new_password?: string[];
              confirm_password?: string[];
              detail?: string;
            };
          };
        }
      ).response?.data;
      const errorMessage =
        errorData?.token?.[0] ||
        errorData?.new_password?.[0] ||
        errorData?.confirm_password?.[0] ||
        errorData?.detail ||
        "Không thể đặt lại mật khẩu. Token có thể đã hết hạn.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Mật khẩu đã được đặt lại</CardTitle>
          <CardDescription>
            Bạn có thể đăng nhập bằng mật khẩu mới ngay bây giờ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/login")}>
            Đăng nhập ngay
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <CardTitle className="text-2xl text-center">Đặt lại mật khẩu</CardTitle>
        <CardDescription className="text-center">
          Nhập mật khẩu mới cho tài khoản của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Mật khẩu mới</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Ít nhất 8 ký tự"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
