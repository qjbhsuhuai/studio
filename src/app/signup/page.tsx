"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { Button } from "@/components/ui/button"
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
            <h1 className="text-3xl font-bold">สร้างบัญชีของคุณ</h1>
            <p className="text-balance text-muted-foreground">
              เข้าร่วมแพลตฟอร์มของเราเพื่อเริ่มต้น
            </p>
          </div>
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
              <Input id="username" placeholder="johndoe123" required />
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
              <Input id="password" type="password" />
               <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  <li>อย่างน้อย 8 ตัวอักษร</li>
                  <li>ตัวอักษรพิมพ์ใหญ่และพิมพ์เล็ก</li>
                  <li>อย่างน้อยหนึ่งหมายเลข</li>
                  <li>อย่างน้อยหนึ่งอักขระพิเศษ</li>
                </ul>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่าน</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button type="submit" className="w-full">
              สร้างบัญชี
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            มีบัญชีอยู่แล้ว?{" "}
            <Link href="/login" className="underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
