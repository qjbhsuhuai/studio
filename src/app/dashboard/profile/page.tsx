
"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  return (
    <div className="flex justify-center items-start py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>แก้ไขโปรไฟล์</CardTitle>
          <CardDescription>
            จัดการการตั้งค่าบัญชีและข้อมูลของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" data-ai-hint="person avatar" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
                <Button variant="outline">เปลี่ยนรูปภาพ</Button>
                <p className="text-xs text-muted-foreground">JPG, GIF หรือ PNG. ขนาดสูงสุด 1MB</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ</Label>
            <Input id="name" placeholder="ชื่อที่แสดง" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input id="email" type="email" placeholder="m@example.com" disabled />
          </div>
           <div className="space-y-2">
            <Label htmlFor="current-password">รหัสผ่านปัจจุบัน</Label>
            <Input id="current-password" type="password" />
          </div>
           <div className="space-y-2">
            <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
            <Input id="new-password" type="password" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>บันทึกการเปลี่ยนแปลง</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
