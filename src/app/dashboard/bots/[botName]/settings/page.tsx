
"use client"

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Copy, Check, ShieldQuestion, Trash2, Power, Code, FileCog, Package, CircleDollarSign } from 'lucide-react';

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
    // { id: 'perm-renew', label: 'ต่ออายุโปรเจกต์', description: 'อนุญาตให้ผู้ใช้ต่ออายุการใช้งานของโปรเจกต์ (ถ้ามี)', key: 'canRenew' },
];

type PermissionsState = {
    canRun: boolean;
    canEdit: boolean;
    canManageFiles: boolean;
    canInstall: boolean;
};

export default function ProjectSettingsPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const botName = params.botName as string;

    const [projectName, setProjectName] = useState(botName);
    const [isSaving, setIsSaving] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    
    // State for sharing
    const [isSharingEnabled, setIsSharingEnabled] = useState(false);
    const [projectUid, setProjectUid] = useState('');
    const [collaboratorPermissions, setCollaboratorPermissions] = useState<PermissionsState>({
        canRun: true,
        canEdit: false,
        canManageFiles: false,
        canInstall: false,
    });
    
    useEffect(() => {
        // TODO: Fetch project settings from backend API
        // For now, using placeholder data
        setProjectUid(`uid-${botName}-placeholder`);
    }, [botName]);

    const handleGoBack = () => {
        router.back();
    };
    
    const handleSaveChanges = async () => {
        setIsSaving(true);
        // TODO: API call to save project settings (name, sharing status, permissions)
        console.log("Saving settings:", {
            newName: projectName,
            sharingEnabled: isSharingEnabled,
            permissions: collaboratorPermissions
        });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        toast({
            title: "บันทึกสำเร็จ",
            description: "การตั้งค่าโปรเจกต์ของคุณถูกบันทึกแล้ว",
        });
        setIsSaving(false);
        
        if(projectName !== botName) {
            // If name changed, redirect to new URL
            router.replace(`/dashboard/bots/${projectName}/settings`);
        }
    };
    
    const handleDeleteProject = async () => {
        if (deleteConfirmText !== botName) {
            toast({
                title: "การยืนยันไม่ถูกต้อง",
                description: `กรุณาพิมพ์ "${botName}" ให้ถูกต้องเพื่อยืนยันการลบ`,
                variant: "destructive",
            });
            return;
        }
        
        setIsSaving(true);
        // TODO: API call to delete project
        console.log("Deleting project:", botName);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({
            title: "ลบโปรเจกต์สำเร็จ",
            description: `โปรเจกต์ ${botName} ได้ถูกลบออกจากระบบแล้ว`,
        });
        
        setIsDeleteDialogOpen(false);
        router.push('/dashboard/bots');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(projectUid);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handlePermissionChange = (key: keyof PermissionsState, checked: boolean) => {
        setCollaboratorPermissions(prev => ({...prev, [key]: checked}));
    };

    return (
        <div className="flex flex-col h-full text-white bg-black">
            <header className="flex items-center p-4 border-b border-gray-800">
                <Button variant="ghost" size="icon" className="mr-4" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">ตั้งค่าโปรเจกต์: {botName}</h1>
                <div className="ml-auto">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                    </Button>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-auto space-y-8">
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
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="max-w-md bg-input"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Sharing Settings */}
                <Card className="bg-card/50 border-border">
                    <CardHeader>
                        <CardTitle>การแชร์และสิทธิ์การเข้าถึง</CardTitle>
                        <CardDescription>
                            จัดการการทำงานร่วมกับผู้อื่นในโปรเจกต์นี้
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-2">
                           <Switch
                                id="sharing-toggle"
                                checked={isSharingEnabled}
                                onCheckedChange={setIsSharingEnabled}
                            />
                            <Label htmlFor="sharing-toggle">เปิดการแชร์โปรเจกต์</Label>
                        </div>
                        
                        {isSharingEnabled && (
                            <div className="space-y-6 animate-in fade-in-50">
                                <div className="space-y-2">
                                    <Label htmlFor="project-uid">Project UID</Label>
                                    <div className="flex items-center gap-2 max-w-md">
                                        <Input id="project-uid" value={projectUid} readOnly className="font-mono bg-muted text-muted-foreground" />
                                        <Button variant="outline" size="icon" onClick={copyToClipboard}>
                                            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        ส่ง UID นี้ให้เพื่อนเพื่อเชิญเข้ามาทำงานร่วมกันในโปรเจกต์
                                    </p>
                                </div>
                                <div className="space-y-4">
                                     <h3 className="text-md font-semibold">กำหนดสิทธิ์สำหรับผู้เข้าร่วม</h3>
                                     <div className="space-y-4 rounded-md border border-border p-4">
                                        {permissionsList.map((permission) => (
                                             <div key={permission.id} className="flex items-start gap-3">
                                                 <Checkbox
                                                     id={permission.id}
                                                     checked={collaboratorPermissions[permission.key]}
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
