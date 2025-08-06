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
import { BotIcon } from "@/components/icons"

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
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <BotIcon className="h-12 w-12 text-primary" />
            </div>
          <CardTitle className="text-2xl font-bold">สร้างบัญชีใหม่</CardTitle>
          <CardDescription>
            เริ่มใช้งาน BotFarm วันนี้
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full mt-2">
              สมัครสมาชิก
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
