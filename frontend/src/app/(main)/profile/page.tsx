"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, ArrowLeft } from "lucide-react";
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

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Change Password States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      await authService.setPassword(newPassword, confirmPassword);
      toast.success("Đổi mật khẩu thành công!");
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
        "Không thể đổi mật khẩu.";
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
            Quay lại Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground mt-2">
            Quản lý thông tin tài khoản và mật khẩu của bạn
          </p>
        </div>

        <div className="grid gap-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin tài khoản
              </CardTitle>
              <CardDescription>
                Thông tin cơ bản về tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Tên đăng nhập
                  </Label>
                  <p className="text-sm font-medium mt-1">
                    {typeof window !== "undefined"
                      ? localStorage.getItem("username") || "N/A"
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="text-sm font-medium mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {typeof window !== "undefined"
                      ? localStorage.getItem("email") || "N/A"
                      : "N/A"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="text-sm text-muted-foreground">
                <p>
                  Để cập nhật thông tin tài khoản, vui lòng liên hệ quản trị
                  viên.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Cập nhật mật khẩu mới cho tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Ít nhất 8 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
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
                    minLength={8}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
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
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Security Tips */}
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">
                💡 Mẹo bảo mật
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
                <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                <li>Không sử dụng cùng mật khẩu cho nhiều tài khoản</li>
                <li>Đổi mật khẩu định kỳ để bảo vệ tài khoản</li>
                <li>Không chia sẻ mật khẩu với người khác</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
