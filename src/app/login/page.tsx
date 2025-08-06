
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

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
import { get, ref } from "firebase/database"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simplified admin check
    if (username.toLowerCase() === 'admin' && password === 'admin') {
      localStorage.setItem("username", "admin")
      router.push("/dashboard")
      return
    }

    try {
      const userId = username.replace(/[.#$[\]]/g, "_")
      const userRef = ref(db, 'users/' + userId);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        if (userData.password === password) {
          localStorage.setItem("username", userData.email.split('@')[0]);
          router.push("/dashboard");
        } else {
          toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: "รหัสผ่านไม่ถูกต้อง",
            variant: "destructive"
          });
        }
      } else {
         toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: "ไม่พบชื่อผู้ใช้นี้ในระบบ",
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
  
    useEffect(() => {
    const activeApiUrl = localStorage.getItem("activeApiUrl");
    if (!activeApiUrl) {
       localStorage.setItem("apiList", JSON.stringify([{id: "1", name: "Default Server", url: "https://cfgnnn-production.up.railway.app"}]));
       localStorage.setItem("activeApiUrl", "https://cfgnnn-production.up.railway.app");
    }
  }, []);


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
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
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
