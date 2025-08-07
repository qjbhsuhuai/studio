
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Copy, Check, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import { get, ref, set, onValue, off, update, push } from "firebase/database";
import { db } from "@/lib/firebase";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


type Permission = {
    id: string;
    label: string;
    description: string;
    key: 'canRun' | 'canEdit' | 'canManageFiles' | 'canInstall';
};

const permissionsList: Permission[] = [
    { id: 'perm-run', label: 'รัน/หยุด โปรเจกต์', description: 'อนุญาตให้ผู้ใช้เริ่มและหยุดการทำงานของโปรเจกต์ได้', key: 'canRun' },
    { id: 'perm-edit', label: 'แก้ไขโค้ด', description: 'อนุญาตให้ผู้ใช้เข้าถึงและแก้ไขไฟล์โค้ดทั้งหมดในโปรเจกต์', key: 'canEdit' },
    { id: 'perm-files', label: 'จัดการไฟล์', description: 'อนุญาตให้สร้าง, ลบ, และเปลี่ยนชื่อไฟล์/โฟลเดอร์', key: 'canManageFiles' },
    { id: 'perm-install', label: 'ติดตั้งโมดูล', description: 'อนุญาตให้ใช้คำสั่งติดตั้ง Dependencies/Packages ใหม่ๆ', key: 'canInstall' },
];

type PermissionsState = {
    canRun: boolean;
    canEdit: boolean;
    canManageFiles: boolean;
    canInstall: boolean;
};

type ProjectSettings = {
    projectName: string;
    sharingEnabled: boolean;
    projectUid: string;
    permissions: PermissionsState;
    ownerId: string;
    expiresAt?: number;
};

type CollaboratorRequest = {
    id: string;
    userId: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'rejected';
}

export default function ProjectSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const botName = params.botName as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    
    // Project State
    const [settings, setSettings] = useState<ProjectSettings | null>(null);
    const [requests, setRequests] = useState<CollaboratorRequest[]>([]);

    // Dialog State
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [userId, setUserId] = useState<string | null>(null);


    useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (!userId || !botName) return;

        const settingsRef = ref(db, `bots/${userId}/${botName}/settings`);
        const requestsRef = ref(db, `bots/${userId}/${botName}/requests`);
        
        setIsLoading(true);

        const settingsListener = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                setSettings(snapshot.val());
            } else {
                // This case should ideally not happen if settings are created with the bot
                // but as a fallback, we can initialize them.
                const newUid = `uid-${botName}-${Date.now()}`;
                const initialSettings: ProjectSettings = {
                    projectName: botName,
                    sharingEnabled: false,
                    projectUid: newUid,
                    ownerId: userId,
                    permissions: {
                        canRun: true,
                        canEdit: false,
                        canManageFiles: false,
                        canInstall: false,
                    },
                    expiresAt: 0,
                };
                set(settingsRef, initialSettings);
                setSettings(initialSettings);
            }
            setIsLoading(false);
        });

        const requestsListener = onValue(requestsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const requestsList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                setRequests(requestsList);
            } else {
                setRequests([]);
            }
        });

        return () => {
            off(settingsRef, 'value', settingsListener);
            off(requestsRef, 'value', requestsListener);
        };

    }, [userId, botName]);

    const handleGoBack = () => {
        router.back();
    };
    
    const handleSaveChanges = async () => {
        if (!settings || !userId) return;

        setIsSaving(true);
        const settingsRef = ref(db, `bots/${userId}/${botName}/settings`);
        
        try {
            await update(settingsRef, settings);
            toast({
                title: "บันทึกสำเร็จ",
                description: "การตั้งค่าโปรเจกต์ของคุณถูกบันทึกแล้ว",
            });
            
            if(settings.projectName !== botName) {
                // TODO: Handle project rename logic (complex, involves moving data)
                // For now, just show a message and redirect
                toast({
                    title: "เปลี่ยนชื่อโปรเจกต์",
                    description: "การเปลี่ยนชื่อโปรเจกต์ยังไม่รองรับในตอนนี้",
                    variant: "destructive"
                });
                router.replace(`/dashboard/bots/${botName}/settings`); // Stay on old page
            }
        } catch (error) {
             toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกการตั้งค่าได้",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteProject = async () => {
        if (deleteConfirmText !== botName || !userId) {
            toast({
                title: "การยืนยันไม่ถูกต้อง",
                description: `กรุณาพิมพ์ "${botName}" ให้ถูกต้องเพื่อยืนยันการลบ`,
                variant: "destructive",
            });
            return;
        }
        
        setIsSaving(true);
        const projectRef = ref(db, `bots/${userId}/${botName}`);
        try {
            await set(projectRef, null); // Deletes the entire project node
            toast({
                title: "ลบโปรเจกต์สำเร็จ",
                description: `โปรเจกต์ ${botName} ได้ถูกลบออกจากระบบแล้ว`,
            });
            setIsDeleteDialogOpen(false);
            router.push('/dashboard/bots');
        } catch (error) {
            toast({
                title: "เกิดข้อผิดพลาดในการลบ",
                description: "ไม่สามารถลบโปรเจกต์ได้",
                variant: "destructive",
            });
            setIsSaving(false);
        }
    };

    const copyToClipboard = () => {
        if (!settings?.projectUid) return;
        navigator.clipboard.writeText(settings.projectUid);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handlePermissionChange = (key: keyof PermissionsState, checked: boolean) => {
        if (!settings) return;
        setSettings(prev => prev ? ({...prev, permissions: {...prev.permissions, [key]: checked}}) : null);
    };
    
    const handleSharingToggle = (checked: boolean) => {
        if (!settings) return;
        setSettings(prev => prev ? ({...prev, sharingEnabled: checked}) : null);
    };

    const handleProjectNameChange = (newName: string) => {
        if (!settings) return;
        setSettings(prev => prev ? ({...prev, projectName: newName}) : null);
    };

    const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
        if (!userId || !botName) return;
        const requestRef = ref(db, `bots/${userId}/${botName}/requests/${requestId}/status`);
        try {
            await set(requestRef, action);
            toast({
                title: "สำเร็จ",
                description: `คำขอถูก${action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}แล้ว`
            });
        } catch (error) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถอัปเดตคำขอได้",
                variant: "destructive"
            });
        }
    }


    if (isLoading || !settings) {
        return (
            <div className="flex flex-col h-full text-white bg-black p-4 md:p-6 space-y-8">
                 <header className="flex items-center p-4 border-b border-gray-800 -mx-4 -mt-4 md:-mx-6 md:-mt-6">
                    <Skeleton className="h-10 w-10 mr-4" />
                    <Skeleton className="h-6 w-48" />
                    <div className="ml-auto">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </header>
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-1/2" />
                    </CardContent>
                </Card>
                 <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <Skeleton className="h-6 w-64 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-48" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full text-white bg-black">
            <header className="flex items-center p-4 border-b border-gray-800">
                <Button variant="ghost" size="icon" className="mr-4" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl font-semibold truncate">ตั้งค่า: {botName}</h1>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleSaveChanges} disabled={isSaving} size="sm">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-4 md:p-6 overflow-auto space-y-8">
                {/* General Settings */}
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <CardTitle>การตั้งค่าทั่วไป</CardTitle>
                        <CardDescription>จัดการชื่อและข้อมูลพื้นฐานของโปรเจกต์ของคุณ</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-name">ชื่อโปรเจกต์</Label>
                            <Input
                                id="project-name"
                                value={settings.projectName}
                                onChange={(e) => handleProjectNameChange(e.target.value)}
                                className="max-w-md bg-input"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sharing Settings */}
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <CardTitle>การแชร์และสิทธิ์</CardTitle>
                        <CardDescription>
                            จัดการการทำงานร่วมกับผู้อื่นในโปรเจกต์นี้
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                           <Switch
                                id="sharing-toggle"
                                checked={settings.sharingEnabled}
                                onCheckedChange={handleSharingToggle}
                            />
                            <Label htmlFor="sharing-toggle">เปิดการแชร์โปรเจกต์</Label>
                        </div>
                        
                        {settings.sharingEnabled && (
                            <div className="space-y-6 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="project-uid">Project UID</Label>
                                    <div className="flex items-center gap-2 max-w-md">
                                        <Input id="project-uid" value={settings.projectUid} readOnly className="font-mono bg-muted text-muted-foreground" />
                                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        ส่ง UID นี้ให้เพื่อนเพื่อเชิญเข้ามาทำงานร่วมกัน
                                    </p>
                                </div>
                                <div className="space-y-4">
                                     <h3 className="text-md font-semibold">กำหนดสิทธิ์สำหรับผู้เข้าร่วม</h3>
                                     <div className="space-y-4 rounded-md border border-border p-4">
                                        {permissionsList.map((permission) => (
                                             <div key={permission.id} className="flex items-start gap-3">
                                                 <Checkbox
                                                     id={permission.id}
                                                     checked={settings.permissions[permission.key]}
                                                     onCheckedChange={(checked) => handlePermissionChange(permission.key, !!checked)}
                                                     className="mt-1"
                                                 />
                                                 <div className="grid gap-1.5 leading-none">
                                                     <label htmlFor={permission.id} className="font-medium cursor-pointer">
                                                         {permission.label}
                                                     </label>
                                                     <p className="text-sm text-muted-foreground">
                                                        {permission.description}
                                                     </p>
                                                 </div>
                                             </div>
                                        ))}
                                     </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                {/* Join Requests */}
                {settings.sharingEnabled && (
                    <Card className="bg-card/50 border-border">
                        <CardHeader>
                            <CardTitle>คำขอเข้าร่วม</CardTitle>
                            <CardDescription>จัดการคำขอจากผู้ใช้ที่ต้องการเข้าร่วมโปรเจกต์</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {requests.length > 0 ? (
                                <ul className="space-y-3">
                                    {requests.map(req => (
                                        <li key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-md bg-muted/50 gap-4">
                                            <div className="min-w-0">
                                                <p className="font-medium truncate">{req.userEmail}</p>
                                                <Badge variant={
                                                    req.status === 'approved' ? 'default' :
                                                    req.status === 'rejected' ? 'destructive' : 'secondary'
                                                } className={`mt-1 text-xs ${req.status === 'approved' ? 'bg-green-600' : ''}`}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2 self-start sm:self-center flex-shrink-0">
                                                    <Button size="sm" variant="outline" className="text-green-400 border-green-400 hover:bg-green-400/10 hover:text-green-300" onClick={() => handleRequestAction(req.id, 'approved')}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        อนุมัติ
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400/10 hover:text-red-300" onClick={() => handleRequestAction(req.id, 'rejected')}>
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        ปฏิเสธ
                                                    </Button>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-4">ยังไม่มีคำขอเข้าร่วม</p>
                            )}
                        </CardContent>
                    </Card>
                )}


                {/* Danger Zone */}
                <Card className="border-destructive bg-destructive/10">
                     <CardHeader>
                        <CardTitle className="text-destructive">โซนอันตราย</CardTitle>
                        <CardDescription className="text-destructive/80">
                            การกระทำในส่วนนี้ไม่สามารถย้อนกลับได้ โปรดดำเนินการด้วยความระมัดระวัง
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            ลบโปรเจกต์นี้
                        </Button>
                    </CardContent>
                </Card>
            </main>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>คุณแน่ใจหรือไม่?</DialogTitle>
                  <DialogDescription>
                    การกระทำนี้ไม่สามารถย้อนกลับได้ โปรเจกต์และไฟล์ทั้งหมดจะถูกลบอย่างถาวร
                    เพื่อยืนยัน กรุณาพิมพ์ <span className="font-bold text-primary">{botName}</span> ลงในช่องด้านล่าง
                  </DialogDescription>
                </DialogHeader>
                 <div className="py-4">
                    <Input 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`พิมพ์ "${botName}" เพื่อยืนยัน`}
                        className="bg-input"
                    />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ยกเลิก</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteProject}
                    disabled={deleteConfirmText !== botName || isSaving}
                   >
                    {isSaving ? 'กำลังลบ...' : 'ฉันเข้าใจ, ลบโปรเจกต์นี้'}
                   </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
    );
}

    
