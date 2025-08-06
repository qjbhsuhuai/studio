"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"

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
import { CloudIcon } from "@/components/icons"

export default function SignupPage() {
  const router = useRouter()

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd have auth logic here.
    // For this scaffold, we'll just navigate to the dashboard.
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <CloudIcon className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">OVEZX CLOUD</span>
          </div>
          <CardTitle className="text-3xl font-bold">สร้างบัญชีของคุณ</CardTitle>
          <CardDescription>
            เข้าร่วมแพลตฟอร์มของเราเพื่อเริ่มต้น
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">ชื่อจริง</Label>
                <Input id="first-name" placeholder="John" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">นามสกุล</Label>
                <Input id="last-name" placeholder="Doe" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                placeholder="johndoe123"
                required
              />
               <p className="text-xs text-muted-foreground">3-20 characters (letters, numbers, or _)</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" required />
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> อย่างน้อย 8 ตัวอักษร</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> ตัวอักษรพิมพ์ใหญ่และพิมพ์เล็ก</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> อย่างน้อยหนึ่งหมายเลข</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> อย่างน้อยหนึ่งอักขระพิเศษ</li>
              </ul>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
              <Input id="confirm-password" type="password" required />
            </div>
            <Button type="submit" className="w-full mt-2">
              สร้างบัญชี
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
