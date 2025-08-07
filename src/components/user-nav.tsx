
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

type UserData = {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    credits?: number;
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
        // Handle case where user is not in DB
        // Special case for hardcoded admin
        if (loggedInUserEmail.toLowerCase() === 'admin@example.com') {
          const adminData = {
            firstName: "แอดมิน",
            lastName: "",
            email: "admin@example.com",
            role: "Admin",
            credits: 0, // Initial credits
            status: "Active"
          };
          // Set the data in Firebase so the listener will pick it up on subsequent loads
          set(userRef, adminData).then(() => {
             setUser(adminData);
          });
        } else {
          // Regular user not found, something is wrong, log them out.
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
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9" />
        </Button>
    )
  }

  return (
    <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="" alt="@user" data-ai-hint="person avatar" />
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
             <DropdownMenuItem>
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
                <span>บอท</span>
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
                  value={creditsToAdd}
                  onChange={(e) => setCreditsToAdd(Number(e.target.value))}
                  className="col-span-3"
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
