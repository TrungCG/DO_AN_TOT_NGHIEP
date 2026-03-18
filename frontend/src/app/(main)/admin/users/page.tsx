"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/services/user";
import { User } from "@/types/auth";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserCog, Shield, ShieldOff, Trash2, UserCheck, UserX, Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [processingUserId, setProcessingUserId] = useState<number | null>(null);

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      try {
        const user = await userService.getCurrentUser();
        setCurrentUser(user);
        
        if (!user.is_staff) {
          toast.error("Bạn không có quyền truy cập trang này");
          router.push("/dashboard");
          return;
        }

        const usersData = await userService.adminGetAll();
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        toast.error(getErrorMessage(error));
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    checkAdminAndLoadUsers();
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.first_name.toLowerCase().includes(query) ||
            user.last_name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const handleToggleStaff = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Không thể thay đổi quyền của chính mình");
      return;
    }
    
    setProcessingUserId(user.id);
    try {
      const updatedUser = await userService.adminUpdateUser(user.id, {
        is_staff: !user.is_staff,
      });
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      toast.success(
        user.is_staff
          ? `Đã gỡ quyền admin của ${user.username}`
          : `Đã cấp quyền admin cho ${user.username}`
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Không thể vô hiệu hóa chính mình");
      return;
    }
    
    setProcessingUserId(user.id);
    try {
      const updatedUser = await userService.adminUpdateUser(user.id, {
        is_active: !user.is_active,
      });
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      toast.success(
        user.is_active
          ? `Đã vô hiệu hóa tài khoản ${user.username}`
          : `Đã kích hoạt tài khoản ${user.username}`
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Không thể xóa chính mình");
      return;
    }
    
    setProcessingUserId(user.id);
    try {
      await userService.adminDeleteUser(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
      toast.success(`Đã xóa tài khoản ${user.username}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setProcessingUserId(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
            <p className="text-muted-foreground">
              Tổng cộng {users.length} người dùng
            </p>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày tham gia</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy người dùng nào
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                        {user.first_name?.[0] || user.username[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Bạn
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.is_staff ? (
                      <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Người dùng</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active !== false ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <UserX className="h-3 w-3 mr-1" />
                        Vô hiệu
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.date_joined)}</TableCell>
                  <TableCell>
                    {user.id !== currentUser?.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={processingUserId === user.id}
                          >
                            {processingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleStaff(user)}>
                            {user.is_staff ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Gỡ quyền admin
                              </>
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-2" />
                                Cấp quyền admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                            {user.is_active !== false ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Vô hiệu hóa
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Kích hoạt
                              </>
                            )}
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa tài khoản
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Xác nhận xóa tài khoản
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Bạn có chắc chắn muốn xóa tài khoản của{" "}
                                  <strong>{user.username}</strong>? Hành động này không
                                  thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
