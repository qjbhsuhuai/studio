"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ref, set } from "firebase/database"

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
import { db } from "@/lib/firebase"

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
      // Use email as a key, replacing invalid characters
      const userId = email.replace(/[.#$[\]]/g, "_");
      await set(ref(db, 'users/' + userId), {
        firstName,
        lastName,
        email,
        password, // Note: Storing plain text passwords is not secure. Use Firebase Authentication.
        role: email.toLowerCase() === 'admin@example.com' ? 'Admin' : 'User'
      });
      
      // Store username for dashboard
      localStorage.setItem("username", email.split('@')[0])
      router.push("/dashboard")
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก กรุณาลองใหม่")
      console.error(err)
    } finally {
      setIsLoading(false)
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
            <Button variant="outline" className="w-full" disabled={isLoading}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              สมัครด้วย Google
            </Button>
          </form>
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
