
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { ref, set, get } from "firebase/database"
import { Github } from "lucide-react"

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
import { db, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { 
    signInWithPopup, 
    GoogleAuthProvider,
    GithubAuthProvider
} from "firebase/auth"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSuccessfulLogin = (email: string, name: string) => {
      toast({
          title: "เข้าสู่ระบบสำเร็จ",
          description: `ยินดีต้อนรับ, ${name}!`,
      });
      if (typeof window !== "undefined") {
          sessionStorage.setItem("userEmail", email);
          router.push("/dashboard");
      }
  };

  const handleSocialLogin = async (provider: GoogleAuthProvider | GithubAuthProvider) => {
    setIsLoading(true);
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (!user.email) {
            throw new Error("ไม่สามารถเข้าสู่ระบบได้เนื่องจากไม่มีอีเมล");
        }
        
        const userId = user.email.replace(/[.#$[\]]/g, "_");
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
             const userData = snapshot.val();
             if (userData.status === "Banned") {
                 toast({
                     title: "เข้าสู่ระบบไม่สำเร็จ",
                     description: "บัญชีของคุณถูกระงับการใช้งาน",
                     variant: "destructive",
                 });
             } else {
                 handleSuccessfulLogin(userData.email, userData.firstName || user.displayName || 'User');
             }
        } else {
            // New user via social login, create DB entry
            const nameParts = user.displayName?.split(" ") || ["User"];
            const newUser = {
                firstName: nameParts[0],
                lastName: nameParts.slice(1).join(" ") || "",
                email: user.email,
                role: 'User',
                credits: 0,
                status: "Active"
            };
            await set(userRef, newUser);
            handleSuccessfulLogin(newUser.email, newUser.firstName);
        }
    } catch (error: any) {
        toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: error.message || "เกิดข้อผิดพลาดในการล็อกอินด้วยโซเชียล",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      setIsLoading(false)
      return
    }

    try {
      const userId = email.replace(/[.#$[\]]/g, "_");
      const userRef = ref(db, 'users/' + userId);
      
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
          setError("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ");
          setIsLoading(false);
          return;
      }

      await set(userRef, {
        firstName,
        lastName,
        email,
        password, 
        role: email.toLowerCase() === 'admin@example.com' ? 'Admin' : 'User',
        credits: 0, 
        status: "Active"
      });
      
      toast({
        title: "สร้างบัญชีสำเร็จ",
        description: "บัญชีของคุณพร้อมใช้งานแล้ว",
      })
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('userEmail', email);
        router.push("/dashboard")
      }
      
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่")
      toast({
        title: "สมัครสมาชิกไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดในการสร้างบัญชีของคุณ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isClient) {
    return null;
  }


  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
              <BotIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">BotFarm</h1>
          </div>
          <CardTitle className="text-2xl font-bold">สร้างบัญชี</CardTitle>
          <CardDescription>
            กรอกข้อมูลเพื่อสร้างบัญชีใหม่
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">ชื่อจริง</Label>
                <Input 
                  id="first-name" 
                  placeholder="ชื่อจริง" 
                  required 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">นามสกุล</Label>
                <Input 
                  id="last-name" 
                  placeholder="นามสกุล" 
                  required 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชี'}
            </Button>
          </form>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        หรือสมัครด้วย
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" disabled={isLoading} onClick={() => handleSocialLogin(new GoogleAuthProvider())}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Button>
                 <Button variant="outline" className="w-full" disabled={isLoading} onClick={() => handleSocialLogin(new GithubAuthProvider())}>
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                </Button>
            </div>
          <div className="mt-4 text-center text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
