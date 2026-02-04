"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { projectService } from "@/services/project";
import { userService } from "@/services/user";
import { User } from "@/types/auth";
import { cn } from "@/lib/utils";

interface AddMemberDialogProps {
  projectId: number;
  onSuccess: () => void;
}

export function AddMemberDialog({
  projectId,
  onSuccess,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 2) return;
    try {
      const data = await userService.search(query);
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setIsLoading(true);
    try {
      await projectService.addMember(projectId, selectedUser.id);
      toast.success("Đã thêm thành viên thành công!");
      setOpen(false);
      setSelectedUser(null);
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Lỗi thêm thành viên");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm thành viên
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thêm thành viên vào dự án</DialogTitle>
          <DialogDescription>
            Tìm kiếm người dùng bằng tên hoặc email.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between"
              >
                {selectedUser
                  ? selectedUser.username
                  : "Tìm kiếm người dùng..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Nhập tên hoặc email..."
                  onValueChange={handleSearch}
                />
                <CommandList>
                  <CommandEmpty>Không tìm thấy người dùng.</CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.username}
                        onSelect={() => {
                          setSelectedUser(user);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUser?.id === user.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {user.username} ({user.email})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button
            onClick={handleAddMember}
            disabled={!selectedUser || isLoading}
          >
            {isLoading ? "Đang thêm..." : "Thêm thành viên"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
