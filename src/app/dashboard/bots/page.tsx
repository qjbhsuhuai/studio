// This is a placeholder file. The content will be implemented in the next steps.
"use client"

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Bot, MoreHorizontal, Play, StopCircle, Trash2, CheckCircle, XCircle, Package, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BotsPage() {
    const { data, error, mutate } = useSWR('/api/scripts', fetcher, { refreshInterval: 3000 });
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
    const [selectedBot, setSelectedBot] = useState<string | null>(null);
    const [moduleName, setModuleName] = useState('');
    
    const handleAction = async (action: 'run' | 'stop', botName: string) => {
        setIsLoading(prev => ({ ...prev, [botName]: true }));
        try {
            const res = await fetch(`/api/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: botName }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
            }
            // No need to call mutate() here, SWR will revalidate automatically
        } catch (err) {
            alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`);
        } finally {
             setTimeout(() => {
                mutate();
                setIsLoading(prev => ({ ...prev, [botName]: false }));
            }, 1000);
        }
    };
    
    const openDeleteDialog = (botName: string) => {
        setSelectedBot(botName);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBot) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
            const res = await fetch(`/api/scripts/${selectedBot}`, { method: 'DELETE' });
             if (!res.ok) {
                const errorData = await res.json();
                alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
            }
        } catch (err) {
             alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`);
        } finally {
            mutate();
            setIsLoading(prev => ({ ...prev, [selectedBot]: false }));
            setIsDeleteDialogOpen(false);
            setSelectedBot(null);
        }
    }
    
    const openInstallDialog = (botName: string) => {
        setSelectedBot(botName);
        setIsInstallDialogOpen(true);
    };

    const confirmInstall = async () => {
        if (!selectedBot || !moduleName) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
             await fetch(`/api/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName: selectedBot, module: moduleName }),
            });
            // The result will be streamed via WebSocket, just close the dialog.
        } catch (err) {
             alert(`เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err}`);
        } finally {
            setIsLoading(prev => ({ ...prev, [selectedBot]: false }));
            setIsInstallDialogOpen(false);
            setModuleName('');
            alert(`คำสั่งติดตั้ง '${moduleName}' ถูกส่งไปยังเซิร์ฟเวอร์แล้ว โปรดไปที่หน้าจัดการบอทเพื่อดูผลลัพธ์`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">จัดการบอท</h1>
                    <p className="text-muted-foreground">จัดการโปรเจกต์บอททั้งหมดของคุณที่นี่</p>
                </div>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    สร้างโปรเจกต์ใหม่
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>รายการบอท</CardTitle>
                    <CardDescription>
                        บอททั้งหมดที่มีอยู่ในระบบ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>สถานะ</TableHead>
                                <TableHead>ชื่อ</TableHead>
                                <TableHead>ประเภท</TableHead>
                                <TableHead>CPU</TableHead>
                                <TableHead>Memory</TableHead>
                                <TableHead>Port</TableHead>
                                <TableHead className="text-right">การกระทำ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {error && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-destructive">
                                        ไม่สามารถโหลดข้อมูลบอทได้
                                    </TableCell>
                                </TableRow>
                            )}
                            {!data && !error && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">
                                        กำลังโหลด...
                                    </TableCell>
                                </TableRow>
                            )}
                            {data?.scripts.map((bot: any) => (
                                <TableRow key={bot.name}>
                                    <TableCell>
                                        <Badge
                                            variant={bot.status === 'running' ? 'default' : 'secondary'}
                                            className={bot.status === 'running' ? 'bg-green-500 hover:bg-green-600' : ''}
                                        >
                                            {bot.status === 'running' ? (
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                            ) : (
                                                <XCircle className="mr-1 h-3 w-3" />
                                            )}
                                            {bot.status === 'running' ? 'ออนไลน์' : 'ออฟไลน์'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{bot.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{bot.type}</Badge>
                                    </TableCell>
                                    <TableCell>{bot.cpu || 'N/A'}</TableCell>
                                    <TableCell>{bot.memory ? `${bot.memory} MB` : 'N/A'}</TableCell>
                                     <TableCell>{bot.port || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isLoading[bot.name]}>
                                                    {isLoading[bot.name] ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <MoreHorizontal className="h-4 w-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>การกระทำ</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleAction(bot.status === 'running' ? 'stop' : 'run', bot.name)}>
                                                    {bot.status === 'running' ? <><StopCircle className="mr-2 h-4 w-4" /><span>หยุด</span></> : <><Play className="mr-2 h-4 w-4" /><span>เริ่ม</span></>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/bots/${bot.name}`}>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        จัดการบอท
                                                    </Link>
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => openInstallDialog(bot.name)}>
                                                    <Package className="mr-2 h-4 w-4" />
                                                    <span>ติดตั้ง Dependencies</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(bot.name)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>ลบ</span>
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
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ยืนยันการลบ</DialogTitle>
                  <DialogDescription>
                    คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์ '{selectedBot}'? การกระทำนี้ไม่สามารถย้อนกลับได้
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ยกเลิก</Button>
                  <Button variant="destructive" onClick={confirmDelete}>ยืนยันการลบ</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ติดตั้ง Dependencies สำหรับ '{selectedBot}'</DialogTitle>
                        <DialogDescription>
                            ระบุชื่อโมดูลที่ต้องการติดตั้ง (เช่น express, discord.js)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="module-name" className="text-right">
                           ชื่อโมดูล
                         </Label>
                         <Input
                           id="module-name"
                           value={moduleName}
                           onChange={(e) => setModuleName(e.target.value)}
                           className="col-span-3"
                           placeholder="เช่น discord.js"
                         />
                       </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => { setIsInstallDialogOpen(false); setModuleName(''); }}>ยกเลิก</Button>
                         <Button onClick={confirmInstall}>ติดตั้ง</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
