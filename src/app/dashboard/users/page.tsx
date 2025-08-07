
"use client"

import { useState, useEffect } from "react"
import { MoreHorizontal, Trash2, Ban, CheckCircle, XCircle, ShieldX } from "lucide-react"
import { get, ref, set, onValue, off, remove } from "firebase/database"
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
  DropdownMenuSeparator,
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
  status: "Active" | "Banned" | "Pending"
  avatar: string
  credits?: number
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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
          avatar: '', // Placeholder for avatar
          status: usersData[key].status || "Active", // Default to Active if not set
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setIsLoading(false);
    });

    return () => off(usersRef, 'value', listener);
  }, []);

  const handleManageCreditsClick = (user: User) => {
    setSelectedUser(user)
    setCredits(user.credits ?? 0)
    setIsCreditDialogOpen(true)
  }
  
  const handleSaveChanges = async () => {
    if (!selectedUser) return;
    
    const userRef = ref(db, `users/${selectedUser.id}`);
    try {
      const snapshot = await get(userRef);
      if(snapshot.exists()) {
        const userData = snapshot.val();
        await set(userRef, {
          ...userData,
          credits: credits
        });
        toast({
          title: "สำเร็จ",
          description: `บันทึกเครดิตของ ${selectedUser.name} เรียบร้อยแล้ว`,
        });
      }
       setIsCreditDialogOpen(false);
       setSelectedUser(null);
    } catch (error) {
       toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  }

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    const userRef = ref(db, `users/${selectedUser.id}`);
    try {
      await remove(userRef);
      toast({
        title: "สำเร็จ",
        description: `ลบผู้ใช้ ${selectedUser.name} เรียบร้อยแล้ว`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const updateUserStatus = async (user: User, newStatus: "Active" | "Banned" | "Pending") => {
     const userRef = ref(db, `users/${user.id}/status`);
     try {
        await set(userRef, newStatus);
        toast({
          title: "สำเร็จ",
          description: `เปลี่ยนสถานะของ ${user.name} เป็น ${newStatus} แล้ว`,
        });
     } catch(error) {
        toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้",
            variant: "destructive",
        });
     }
  }
  
  const handleApprove = (user: User) => {
    updateUserStatus(user, "Active");
  }

  const handleReject = (user: User) => {
    // Rejection means deleting the user
    handleDeleteClick(user);
  }

  const handleBanToggle = async (user: User) => {
    const newStatus = user.status === "Active" ? "Banned" : "Active";
    updateUserStatus(user, newStatus);
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">การจัดการผู้ใช้</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            จัดการผู้ใช้ทั้งหมดในระบบของคุณ
          </p>
        </div>
      </div>
      <Card>
        <CardContent className="mt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%] sm:w-auto">ผู้ใช้</TableHead>
                  <TableHead className="hidden sm:table-cell">บทบาท</TableHead>
                  <TableHead className="hidden sm:table-cell">สถานะ</TableHead>
                  <TableHead className="hidden md:table-cell">เครดิต</TableHead>
                  <TableHead className="text-right">การกระทำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                   <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      กำลังโหลด...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
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
                        <div className="font-medium min-w-0">
                          <div className="truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={user.role === "Admin" ? "destructive" : "outline"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                     <TableCell className="hidden sm:table-cell">
                       <Badge variant={
                           user.status === "Active" ? "secondary" 
                           : user.status === "Banned" ? "destructive" 
                           : "default"
                        } className={user.status === 'Pending' ? 'bg-yellow-500' : ''}>
                          {user.status}
                       </Badge>
                     </TableCell>
                     <TableCell className="hidden md:table-cell">
                        {user.credits ?? 0}
                     </TableCell>
                    <TableCell className="text-right">
                       {user.status === 'Pending' ? (
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400/10 hover:text-green-300" onClick={() => handleApprove(user)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    อนุมัติ
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(user)}>
                                    <ShieldX className="mr-2 h-4 w-4" />
                                    ปฏิเสธ
                                </Button>
                            </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={user.role === 'Admin'}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>การกระทำ</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleManageCreditsClick(user)}>
                                จัดการเครดิต
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleBanToggle(user)}>
                                  <Ban className="mr-2 h-4 w-4" />
                                  <span>{user.status === "Active" ? "แบนผู้ใช้" : "ยกเลิกการแบน"}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(user)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>ลบผู้ใช้</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selectedUser && (
        <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
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
              <Button onClick={() => setIsCreditDialogOpen(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button onClick={handleSaveChanges}>บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
       {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
              <DialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ {selectedUser.name} ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
                ยกเลิก
              </Button>
              <Button onClick={confirmDelete} variant="destructive">
                ยืนยันการลบ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
