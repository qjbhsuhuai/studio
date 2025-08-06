"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

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
import { CloudIcon, GoogleIcon } from "@/components/icons"

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you'd have auth logic here.
    // For this scaffold, we'll just navigate to the dashboard.
    router.push("/dashboard")
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="hidden bg-muted lg:block">
        <Image
          src="https://placehold.co/1200x1200.png"
          alt="Image"
          width="1200"
          height="1200"
          className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          data-ai-hint="abstract geometric"
        />
      </div>
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CloudIcon className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">OVEZX CLOUD</h1>
            </div>
            <CardTitle className="text-3xl font-bold">เข้าสู่ระบบ</CardTitle>
            <CardDescription className="text-muted-foreground">
              กรอกอีเมลของคุณด้านล่างเพื่อเข้าสู่ระบบบัญชีของคุณ
            </CardDescription>
          </div>
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
                  className="ml-auto inline-block text-sm underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              เข้าสู่ระบบ
            </Button>
            <Button variant="outline" className="w-full">
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
        </div>
      </div>
    </div>
  )
}
