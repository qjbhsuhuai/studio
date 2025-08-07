
"use client"

import { useEffect, useState } from "react"
import { get, ref, onValue, off, update, set } from "firebase/database"
import { db } from "@/lib/firebase"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
    LayoutDashboard,
    Bot,
    User,
    Users,
    Settings,
    LogOut,
    Coins,
    PlusCircle
} from "lucide-react"
import { Skeleton } from "./ui/skeleton"

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    credits?: number;
    avatar?: string;
}

export function UserNav() {
  const router = useRouter()
  const { toast } = useToast();
  const [user, setUser] = useState<UserData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [creditsToAdd, setCreditsToAdd] = useState<number>(0);
  const [isAddingCredits, setIsAddingCredits] = useState(false);


  useEffect(() => {
    const loggedInUserEmail = sessionStorage.getItem('userEmail');
    if (!loggedInUserEmail) {
      router.push('/login');
      return;
    }

    const id = loggedInUserEmail.replace(/[.#$[\]]/g, "_");
    setUserId(id);
    const userRef = ref(db, 'users/' + id);

    const listener = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setUser(snapshot.val());
      } else {
        if (loggedInUserEmail.toLowerCase() === 'admin@example.com') {
          const adminData: UserData = {
            firstName: "แอดมิน",
            lastName: "",
            email: "admin@example.com",
            role: "Admin",
            credits: 999,
          };
          set(userRef, adminData);
          setUser(adminData);
        } else {
          sessionStorage.removeItem('userEmail');
          router.push('/login');
        }
      }
    });

    return () => off(userRef, 'value', listener);

  }, [router]);


  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    router.push('/login');
  };

  const handleAddCredits = async () => {
    if (!userId || creditsToAdd <= 0) return;

    setIsAddingCredits(true);
    const userRef = ref(db, `users/${userId}`);

    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const currentCredits = snapshot.val().credits || 0;
            const newCredits = currentCredits + creditsToAdd;
            await update(userRef, { credits: newCredits });
            toast({
                title: "สำเร็จ",
                description: `เพิ่มเครดิต ${creditsToAdd} หน่วยเรียบร้อยแล้ว`,
            });
        }
    } catch (error) {
        toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถเพิ่มเครดิตได้",
            variant: "destructive"
        })
    } finally {
        setIsAddingCredits(false);
        setCreditsToAdd(0);
        setIsCreditDialogOpen(false);
    }
  }
  
  const userDisplay = user?.role === "Admin" ? "แอดมิน" : user?.firstName || 'User';
  const isAdmin = user?.role === "Admin";
  
  if (!user) {
    return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
        </div>
    )
  }

  return (
    <>
        <div className="flex items-center gap-2">
             <div className="hidden sm:flex items-center gap-2 bg-card/80 border border-border rounded-full px-3 py-1.5 h-9 text-sm">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="font-semibold">{user.credits ?? 0}</span>
                <span className="text-muted-foreground">เครดิต</span>
             </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || ""} alt="@user" data-ai-hint="person avatar" />
                    <AvatarFallback>{userDisplay?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userDisplay}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem className="sm:hidden">
                      <Coins className="mr-2 h-4 w-4" />
                      <span>เครดิต: {user.credits ?? 0}</span>
                 </DropdownMenuItem>
                 {isAdmin && (
                    <DropdownMenuItem onClick={() => setIsCreditDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>เพิ่มเครดิต</span>
                    </DropdownMenuItem>
                 )}
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>แดชบอร์ด</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push('/dashboard/bots')}>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>โปรเจกต์</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>โปรไฟล์</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => router.push('/dashboard/users')}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>จัดการผู้ใช้</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>ตั้งค่าเซิร์ฟเวอร์</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>เพิ่มเครดิต (สำหรับแอดมิน)</DialogTitle>
              <DialogDescription>
                กรอกจำนวนเครดิตที่ต้องการเพิ่มเข้าบัญชีของคุณ
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits-to-add" className="text-right">
                  จำนวน
                </Label>
                <Input
                  id="credits-to-add"
                  type="number"
                  value={creditsToAdd === 0 ? '' : creditsToAdd}
                  onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  className="col-span-3"
                  placeholder="กรอกจำนวนเครดิต"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreditDialogOpen(false)}>ยกเลิก</Button>
              <Button type="submit" onClick={handleAddCredits} disabled={isAddingCredits}>
                {isAddingCredits ? 'กำลังเพิ่ม...' : 'ยืนยัน'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </>
  )
}
