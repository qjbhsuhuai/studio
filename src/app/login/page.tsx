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
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd have auth logic here.
    // For this scaffold, we'll just navigate to the dashboard.
    router.push("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
             <BotIcon className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            เข้าสู่ระบบบัญชี BotFarm ของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Link
                  href="#"
                  className="ml-auto inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              เข้าสู่ระบบ
            </Button>
          </form>
          <div className="my-4 flex items-center">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs text-muted-foreground">หรือ</span>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" className="w-full">
            <GoogleIcon className="mr-2 h-4 w-4" />
            เข้าสู่ระบบด้วย Google
          </Button>
          <div className="mt-4 text-center text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link href="/signup" className="font-semibold text-primary underline-offset-4 hover:underline">
              สมัครสมาชิก
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}