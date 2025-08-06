
"use client"

import { useEffect, useState } from "react"
import { get, ref, onValue, off } from "firebase/database"
import { db } from "@/lib/firebase"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import {
    LayoutDashboard,
    Bot,
    User,
    Users,
    Settings,
    LogOut,
    Coins
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
  const [user, setUser] = useState<UserData | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const loggedInUserEmail = sessionStorage.getItem('userEmail');
    if (loggedInUserEmail) {
        const userId = loggedInUserEmail.replace(/[.#$[\]]/g, "_");
        const userRef = ref(db, 'users/' + userId);
        
        const listener = onValue(userRef, (snapshot) => {
            if(snapshot.exists()){
                setUser(snapshot.val());
            } else {
                // Handle admin case or user not in DB
                if (loggedInUserEmail.toLowerCase() === 'admin@example.com') {
                     setUser({
                        firstName: "แอดมิน",
                        lastName: "",
                        email: "admin@example.com",
                        role: "Admin",
                        credits: 999
                    });
                } else {
                    // User logged in but not found in DB, clear session
                    sessionStorage.removeItem('userEmail');
                    router.push('/login');
                }
            }
        });

        setUsername(loggedInUserEmail.split('@')[0]);

        return () => off(userRef, 'value', listener);

    } else {
        // No user in session, redirect to login
        router.push('/login');
    }
  }, [router]);


  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    router.push('/login');
  };
  
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
  )
}
