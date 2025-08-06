"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const users: any[] = []

type User = {
  name: string
  email: string
  role: string
  avatar: string
}

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleManageClick = (user: User) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>การจัดการผู้ใช้</CardTitle>
          <CardDescription>
            จัดการผู้ใช้ทั้งหมดในระบบของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead className="text-right">การกระทำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    ไม่มีผู้ใช้
                  </TableCell>
                </TableRow>
              )}
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        <div>{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === "Admin" ? "destructive" : "outline"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>การกระทำ</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleManageClick(user)}>
                          เปลี่ยนรหัสผ่าน
                        </DropdownMenuItem>
                        <DropdownMenuItem>ดูโปรไฟล์</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {selectedUser && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เปลี่ยนรหัสผ่านสำหรับ {selectedUser.name}</DialogTitle>
              <DialogDescription>
                กรุณาป้อนรหัสผ่านใหม่สำหรับ {selectedUser.email}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-password" className="text-right">
                  รหัสผ่านใหม่
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-password" className="text-right">
                  ยืนยันรหัสผ่าน
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
