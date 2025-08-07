
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ShieldX, Loader2 } from "lucide-react"
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
import { useState, useEffect } from "react"
import { get, ref, set } from "firebase/database"
import { db, auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
    signInWithPopup, 
    GoogleAuthProvider,
    GithubAuthProvider,
    User
} from "firebase/auth"

export default function LoginPage() {
  const router = useRouter()
  const [loginInput, setLoginInput] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [shake, setShake] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

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
                setIsBanned(true);
                triggerShake();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setIsBanned(false)

    // A small delay to ensure the loading state is visible
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Admin hardcoded login
      if (loginInput.toLowerCase() === "admin" && password === "admin") {
        handleSuccessfulLogin("admin@example.com", "แอดมิน");
        return
      }

      // Firebase user login
      const usersRef = ref(db, "users/")
      const snapshot = await get(usersRef)

      if (snapshot.exists()) {
        const usersData = snapshot.val()
        let userFound = false
        let userData = null
        let foundKey = null

        for (const key in usersData) {
          const user = usersData[key]
          const username = user.email?.split("@")[0]
          if (
            (user.email.toLowerCase() === loginInput.toLowerCase() ||
              (username && username.toLowerCase() === loginInput.toLowerCase())) &&
            user.password === password
          ) {
            userFound = true
            userData = user
            foundKey = key
            break
          }
        }

        if (userFound && userData) {
           if (userData.status === "Banned") {
            setIsBanned(true)
            triggerShake();
            toast({
              title: "เข้าสู่ระบบไม่สำเร็จ",
              description: "บัญชีของคุณถูกระงับการใช้งาน",
              variant: "destructive",
            })
          } else {
            handleSuccessfulLogin(userData.email, userData.firstName || "User");
            return;
          }
        } else {
           toast({
            title: "เข้าสู่ระบบไม่สำเร็จ",
            description: "ชื่อผู้ใช้, อีเมล หรือรหัสผ่านไม่ถูกต้อง",
            variant: "destructive",
          })
        }
      } else {
        // No users in DB, and not admin
         toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: "ชื่อผู้ใช้, อีเมล หรือรหัสผ่านไม่ถูกต้อง",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error(err)
       toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อเพื่อเข้าสู่ระบบได้",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className={cn(
          "w-full max-w-md transition-all duration-300",
           isBanned ? "border-destructive bg-destructive/10" : "",
           shake ? "animate-shake" : ""
        )}>
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <BotIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">BotFarm</h1>
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>กรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          {isBanned ? (
            <div className="flex flex-col items-center justify-center text-center text-destructive p-4">
                <ShieldX className="h-28 w-28 mb-4 drop-shadow-[0_0_10px_hsl(var(--destructive))]"/>
                <h2 className="text-2xl font-bold">บัญชีนี้ถูกระงับ</h2>
                <p className="text-sm text-destructive/80">กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-input">ชื่อผู้ใช้ หรือ อีเมล</Label>
                  <Input
                    id="login-input"
                    type="text"
                    placeholder="ชื่อผู้ใช้ หรือ m@example.com"
                    required
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
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
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>
              </form>
              <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                          หรือดำเนินการต่อด้วย
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
            </>
          )}
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
