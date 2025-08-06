
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BotIcon, GoogleIcon } from "@/components/icons"
import { useState, useEffect } from "react"
import { get, ref, onValue } from "firebase/database"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [loginInput, setLoginInput] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simplified admin check
    if (loginInput.toLowerCase() === 'admin' && password === 'admin') {
      localStorage.setItem("username", "admin")
       toast({
        title: "เข้าสู่ระบบสำเร็จ",
        description: "ยินดีต้อนรับ, แอดมิน!",
      })
      router.push("/dashboard")
      return
    }

    try {
      const usersRef = ref(db, 'users/');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        let userFound = false;
        let userData = null;

        // Loop through all users to find a match by email or username
        for (const key in usersData) {
          const user = usersData[key];
          const username = user.email?.split('@')[0];
          if ((user.email === loginInput || username === loginInput) && user.password === password) {
            userFound = true;
            userData = user;
            break;
          }
        }

        if (userFound && userData) {
          localStorage.setItem("username", userData.email.split('@')[0]);
          toast({
            title: "เข้าสู่ระบบสำเร็จ",
            description: `ยินดีต้อนรับ, ${userData.firstName}!`,
          })
          router.push("/dashboard");
        } else {
           toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: "ชื่อผู้ใช้, อีเมล หรือรหัสผ่านไม่ถูกต้อง",
            variant: "destructive"
          });
        }
      } else {
         toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: "ไม่พบผู้ใช้ในระบบ",
            variant: "destructive"
          });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อเพื่อเข้าสู่ระบบได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BotIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">BotFarm</h1>
            </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login-input">ชื่อผู้ใช้ หรือ อีเมล</Label>
              <Input
                id="login-input"
                type="text"
                placeholder="ชื่อผู้ใช้ หรือ m@example.com"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-muted-foreground" /> : <Eye className="h-5 w-5 text-muted-foreground" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            </Button>
            <Button variant="outline" className="w-full" disabled={isLoading}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              เข้าสู่ระบบด้วย Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link href="/signup" className="underline">
              สมัครสมาชิก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
