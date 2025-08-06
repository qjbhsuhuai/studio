
"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, UserPlus } from "lucide-react"
import { get, ref, set, onValue, off } from "firebase/database"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"

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

type User = {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  role: string
  avatar: string
  credits?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [credits, setCredits] = useState<number>(0)
  const { toast } = useToast()

  useEffect(() => {
    const usersRef = ref(db, 'users/');
    const listener = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList: User[] = Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key],
          name: `${usersData[key].firstName} ${usersData[key].lastName}`,
          avatar: '' // Placeholder for avatar
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setIsLoading(false);
    });

    // Cleanup listener on component unmount
    return () => off(usersRef, 'value', listener);
  }, []);

  const handleManageClick = (user: User) => {
    setSelectedUser(user)
    setCredits(user.credits ?? 0)
    setIsDialogOpen(true)
  }
  
  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    
    const userRef = ref(db, `users/${selectedUser.id}`);
    try {
      // Get current user data to avoid overwriting other fields
      const snapshot = await get(userRef);
      if(snapshot.exists()) {
        const userData = snapshot.val();
        await set(userRef, {
          ...userData,
          credits: credits
        });
        toast({
          title: "สำเร็จ",
          description: `บันทึกข้อมูลของ ${selectedUser.name} เรียบร้อยแล้ว`,
        });
      }
       setIsDialogOpen(false);
       setSelectedUser(null);
    } catch (error) {
       toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">การจัดการผู้ใช้</h1>
          <p className="text-muted-foreground">
            จัดการผู้ใช้ทั้งหมดในระบบของคุณ
          </p>
        </div>
        <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            เพิ่มผู้ใช้ใหม่
        </Button>
      </div>
      <Card>
        <CardContent className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ผู้ใช้</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>เครดิต</TableHead>
                <TableHead className="text-right">การกระทำ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                 <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    ไม่มีผู้ใช้
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person avatar" />
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
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
                   <TableCell>
                      {user.credits ?? 0}
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
                          จัดการเครดิต
                        </DropdownMenuItem>
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
              <DialogTitle>จัดการเครดิตสำหรับ {selectedUser.name}</DialogTitle>
              <DialogDescription>
                คุณสามารถเพิ่มหรือลดเครดิตสำหรับผู้ใช้นี้ได้
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits" className="text-right">
                  เครดิต
                </Label>
                <Input
                  id="credits"
                  type="number"
                  className="col-span-3"
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsDialogOpen(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button onClick={handleSaveChanges}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
