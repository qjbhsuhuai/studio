
"use client"

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Bot, MoreHorizontal, Play, StopCircle, Trash2, CheckCircle, XCircle, Package, Terminal, GitBranch, Upload, FileCode, HardDrive, File, Folder, Settings, Link2, Clock, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CpuIcon, MemoryStickIcon } from '@/components/icons';
import { get, ref, onValue, off, push, query, orderByChild, equalTo, find, set, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';


const fetcher = (url: string) => fetch(url).then((res) => res.json());

const CountdownTimer = ({ expiryTimestamp }: { expiryTimestamp: number | undefined }) => {
    const calculateTimeLeft = () => {
        if (!expiryTimestamp) return null;
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft: { [key: string]: number } = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    if (!timeLeft || Object.keys(timeLeft).length === 0) {
        return <span className="text-muted-foreground">หมดอายุ</span>;
    }

    const formatTime = (value: number) => value.toString().padStart(2, '0');
    
    return (
        <span>
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
    );
};

type User = {
  id: string
  firstName: string
  lastName: string
  name: string
  email: string
  role: string
  status: "Active" | "Banned"
  avatar: string
  credits?: number
}

type BotProject = {
    name: string;
    status: 'running' | 'stopped';
    cpu: string;
    memory: string;
    expiresAt?: number;
    isOwner: boolean;
    ownerId?: string;
};


export default function BotsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const { data: apiData, error: apiError, mutate: mutateApi } = useSWR(userId ? `/api/scripts?userId=${userId}` : null, fetcher, { refreshInterval: 5000 });
    const [projects, setProjects] = useState<BotProject[]>([]);
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({page: true});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedBot, setSelectedBot] = useState<string | null>(null);
    const [newBotName, setNewBotName] = useState('');
    const [gitUrl, setGitUrl] = useState('');
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [projectUid, setProjectUid] = useState('');
    const [createError, setCreateError] = useState<string | null>(null);
    const { toast } = useToast();
    
    // New states for project creation with credits
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [creationDays, setCreationDays] = useState(1);
    const CREDITS_PER_DAY = 4;
    const totalCost = creationDays * CREDITS_PER_DAY;
    const hasEnoughCredits = currentUser?.credits !== undefined && currentUser.credits >= totalCost;

     useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);

            // Fetch current user data for credits
            const userRef = ref(db, `users/${id}`);
            const listener = onValue(userRef, (snapshot) => {
                if (snapshot.exists()) {
                    setCurrentUser({ id, ...snapshot.val() });
                }
            });
            return () => off(userRef, 'value', listener);

        } else {
            // Handle case where user is not logged in
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        setIsLoading(prev => ({...prev, page: true}));
        const userBotsRef = ref(db, `bots/${userId}`);

        const listener = onValue(userBotsRef, (snapshot) => {
            const botData = snapshot.val();
            const botList: BotProject[] = botData ? Object.keys(botData).map(botName => ({
                name: botName,
                status: 'stopped', // Default status, will be updated by API data
                cpu: 'N/A',
                memory: 'N/A',
                isOwner: true,
            })) : [];
            
            setProjects(botList);
            setIsLoading(prev => ({...prev, page: false}));
        });
        
        return () => off(userBotsRef, 'value', listener);

    }, [userId]);

     useEffect(() => {
        if (apiData?.scripts && projects.length > 0) {
            setProjects(prevProjects => {
                return prevProjects.map(p => {
                    const apiInfo = apiData.scripts.find((s: any) => s.name === p.name);
                    if (apiInfo) {
                        return {
                            ...p,
                            status: apiInfo.status || 'stopped',
                            cpu: apiInfo.cpu || 'N/A',
                            memory: apiInfo.memory ? `${apiInfo.memory}MB` : 'N/A',
                            expiresAt: apiInfo.expiresAt,
                        };
                    }
                    return p;
                });
            });
        }
    }, [apiData, projects.length]);


    const handleAction = async (action: 'run' | 'stop', botName: string) => {
        setIsLoading(prev => ({ ...prev, [botName]: true }));
        try {
            const res = await fetch(`/api/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: botName, userId: userId }),
            });
            const data = await res.json();
             if (!res.ok) throw new Error(data.message);
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
             setTimeout(() => {
                mutateApi();
                setIsLoading(prev => ({ ...prev, [botName]: false }));
            }, 1000);
        }
    };
    
    const openDeleteDialog = (botName: string) => {
        setSelectedBot(botName);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBot || !userId) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
            // Updated to delete from Firebase as well
            const projectRef = ref(db, `bots/${userId}/${selectedBot}`);
            await set(projectRef, null);

            const res = await fetch(`/api/scripts/${selectedBot}?userId=${userId}`, { method: 'DELETE' });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
            toast({ title: 'สำเร็จ', description: `ลบโปรเจกต์ ${selectedBot} สำเร็จ` });
        } catch (err:any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            mutateApi();
            setIsLoading(prev => ({ ...prev, [selectedBot]: false }));
            setIsDeleteDialogOpen(false);
            setSelectedBot(null);
        }
    }
    
    const handleCreateProject = async (creationMethod: 'empty' | 'git' | 'zip') => {
        if (!userId) {
            toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถระบุผู้ใช้ได้ กรุณาล็อกอินใหม่อีกครั้ง', variant: 'destructive' });
            return;
        }

        setIsLoading(prev => ({ ...prev, create: true }));
        setCreateError(null);

        try {
            // --- Credit Deduction Logic ---
            const userRef = ref(db, `users/${userId}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                throw new Error("ไม่พบข้อมูลผู้ใช้ในระบบ");
            }
            const userData = snapshot.val();
            const currentCredits = userData.credits || 0;

            if (currentCredits < totalCost) {
                 throw new Error(`เครดิตไม่เพียงพอ คุณมี ${currentCredits} แต่ต้องการ ${totalCost} เครดิต`);
            }

            const newCredits = currentCredits - totalCost;
            await update(userRef, { credits: newCredits });
            // --- End Credit Deduction Logic ---


            const formData = new FormData();
            formData.append('botName', newBotName);
            formData.append('creationMethod', creationMethod);
            formData.append('userId', userId);
            formData.append('days', creationDays.toString()); // Send days to backend

            if (creationMethod === 'git') {
                formData.append('gitUrl', gitUrl);
            } else if (creationMethod === 'zip' && zipFile) {
                formData.append('file', zipFile);
            }

            const res = await fetch('/api/upload/project', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            if (!res.ok) {
                // Rollback credit deduction on failure
                await update(userRef, { credits: currentCredits });
                throw new Error(result.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจกต์');
            }

            // Also create settings in Firebase
            const settingsRef = ref(db, `bots/${userId}/${newBotName}/settings`);
            const newUid = `uid-${newBotName}-${Date.now()}`;
            await set(settingsRef, {
                projectName: newBotName,
                sharingEnabled: false,
                projectUid: newUid,
                ownerId: userId,
                permissions: { canRun: true, canEdit: false, canManageFiles: false, canInstall: false },
            });


            toast({ title: "สำเร็จ", description: `${result.message} และหักเครดิตไป ${totalCost} หน่วย` });
            setIsCreateDialogOpen(false);
            setNewBotName('');
            setGitUrl('');
            setZipFile(null);
            setCreationDays(1);
            mutateApi();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsLoading(prev => ({ ...prev, create: false }));
        }
    };
    
    const handleJoinProject = async () => {
        const currentUserEmail = sessionStorage.getItem('userEmail');
        if (!projectUid || !userId || !currentUserEmail) {
            toast({ title: 'เกิดข้อผิดพลาด', description: 'กรุณากรอก Project UID และตรวจสอบว่าคุณได้ล็อกอินแล้ว', variant: 'destructive' });
            return;
        }
        setIsLoading(prev => ({ ...prev, join: true }));
        setCreateError(null);

        try {
            const botsRef = ref(db, 'bots');
            const snapshot = await get(botsRef);
            if (!snapshot.exists()) {
                throw new Error("ไม่พบโปรเจกต์ใดๆ ในระบบ");
            }
            
            const allBots = snapshot.val();
            let foundProject = null;
            let ownerId = null;
            let botName = null;

            // Search for the project with the matching UID
            for (const uId in allBots) {
                for (const bName in allBots[uId]) {
                    const settings = allBots[uId][bName].settings;
                    if (settings && settings.projectUid === projectUid) {
                        foundProject = settings;
                        ownerId = uId;
                        botName = bName;
                        break;
                    }
                }
                if (foundProject) break;
            }

            if (!foundProject || !ownerId || !botName) {
                throw new Error("ไม่พบโปรเจกต์ที่มี UID นี้");
            }

            if (!foundProject.sharingEnabled) {
                throw new Error("โปรเจกต์นี้ไม่ได้เปิดการแชร์");
            }

            // Project found, send a join request
            const requestsRef = ref(db, `bots/${ownerId}/${botName}/requests`);
            const newRequestRef = push(requestsRef);
            await set(newRequestRef, {
                userId: userId,
                userEmail: currentUserEmail,
                status: 'pending' // pending, approved, rejected
            });

            toast({
                title: "ส่งคำขอแล้ว",
                description: "คำขอเข้าร่วมโปรเจกต์ของคุณถูกส่งแล้ว รอการตอบรับจากเจ้าของโปรเจกต์",
            });
            
            setIsCreateDialogOpen(false);
            setProjectUid('');

        } catch (err: any) {
             setCreateError(err.message);
        } finally {
             setIsLoading(prev => ({ ...prev, join: false }));
        }
    };


    return (
        <div className="space-y-4">
             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 w-14 fixed bottom-8 right-8 z-20 shadow-lg">
                        <PlusCircle className="h-8 w-8" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>จัดการโปรเจกต์</DialogTitle>
                        <DialogDescription>
                            เลือกวิธีการสร้างหรือเข้าร่วมโปรเจกต์
                        </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="create" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="create">สร้างโปรเจกต์ใหม่</TabsTrigger>
                            <TabsTrigger value="join">เข้าร่วมโปรเจกต์</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="create">
                             <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="bot-name" className="text-right">ชื่อโปรเจกต์</Label>
                                    <Input id="bot-name" value={newBotName} onChange={(e) => setNewBotName(e.target.value)} className="col-span-3" placeholder="my-awesome-bot" />
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4 pt-2">
                                    <Label className="text-right pt-2">ระยะเวลา</Label>
                                    <div className="col-span-3 space-y-3">
                                        <Slider
                                            value={[creationDays]}
                                            onValueChange={(value) => setCreationDays(value[0])}
                                            min={1}
                                            max={30}
                                            step={1}
                                            disabled={!newBotName}
                                        />
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-primary">{creationDays} วัน</span>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <span>ค่าใช้จ่าย: {totalCost}</span>
                                                <Coins className="h-4 w-4" />
                                            </div>
                                        </div>
                                         <div className={`text-xs p-2 rounded-md ${hasEnoughCredits ? 'bg-green-500/10 text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                                            เครดิตของคุณ: {currentUser?.credits ?? 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Tabs defaultValue="empty" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="empty"><FileCode className="mr-2 h-4 w-4" />ว่างเปล่า</TabsTrigger>
                                    <TabsTrigger value="git"><GitBranch className="mr-2 h-4 w-4" />Git</TabsTrigger>
                                    <TabsTrigger value="zip"><Upload className="mr-2 h-4 w-4" />ZIP</TabsTrigger>
                                </TabsList>
                                <TabsContent value="empty">
                                     <Card className="bg-transparent border-0 shadow-none">
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-muted-foreground">
                                                <p>สร้างโปรเจกต์เปล่า คุณจะต้องเพิ่มไฟล์ในภายหลัง</p>
                                            </div>
                                             <DialogFooter className="mt-4">
                                                <Button type="button" onClick={() => handleCreateProject('empty')} disabled={isLoading['create'] || !newBotName || !hasEnoughCredits}>
                                                    {isLoading['create'] ? 'กำลังสร้าง...' : 'สร้างโปรเจกต์'}
                                                </Button>
                                            </DialogFooter>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="git">
                                     <Card className="bg-transparent border-0 shadow-none">
                                        <CardContent className="pt-6 space-y-4">
                                            <div>
                                                <Label htmlFor="git-url">Git Repository URL</Label>
                                                <Input id="git-url" value={gitUrl} onChange={e => setGitUrl(e.target.value)} placeholder="https://github.com/user/repo.git" />
                                            </div>
                                             <DialogFooter>
                                                <Button type="button" onClick={() => handleCreateProject('git')} disabled={isLoading['create'] || !newBotName || !gitUrl || !hasEnoughCredits}>
                                                    {isLoading['create'] ? 'กำลังโคลน...' : 'โคลนโปรเจกต์'}
                                                </Button>
                                            </DialogFooter>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="zip">
                                     <Card className="bg-transparent border-0 shadow-none">
                                        <CardContent className="pt-6 space-y-4">
                                            <div>
                                                <Label htmlFor="zip-file">อัปโหลดไฟล์ .zip</Label>
                                                <Input id="zip-file" type="file" accept=".zip" onChange={e => setZipFile(e.target.files?.[0] || null)} />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" onClick={() => handleCreateProject('zip')} disabled={isLoading['create'] || !newBotName || !zipFile || !hasEnoughCredits}>
                                                    {isLoading['create'] ? 'กำลังอัปโหลด...' : 'สร้างจาก ZIP'}
                                                </Button>
                                            </DialogFooter>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                             {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
                        </TabsContent>

                        <TabsContent value="join">
                             <Card className="bg-transparent border-0 shadow-none">
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <Label htmlFor="project-uid">Project UID</Label>
                                        <Input 
                                            id="project-uid" 
                                            value={projectUid} 
                                            onChange={e => setProjectUid(e.target.value)} 
                                            placeholder="วาง Project UID ที่นี่" 
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">ขอ UID จากเจ้าของโปรเจกต์เพื่อส่งคำขอเข้าร่วม</p>
                                    </div>
                                     <DialogFooter>
                                        <Button type="button" onClick={handleJoinProject} disabled={isLoading['join'] || !projectUid}>
                                            {isLoading['join'] ? 'กำลังส่งคำขอ...' : 'เข้าร่วมโปรเจกต์'}
                                        </Button>
                                    </DialogFooter>
                                     {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {isLoading.page && <p className="text-muted-foreground text-center">Loading projects...</p>}
            {!isLoading.page && projects.length === 0 && (
                <Card className="text-center p-8 bg-card/50">
                    <CardHeader>
                        <CardTitle>ยังไม่มีโปรเจกต์</CardTitle>
                        <CardDescription>ดูเหมือนว่าคุณจะยังไม่ได้สร้างโปรเจกต์เลย</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            สร้างโปรเจกต์แรกของคุณ
                        </Button>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-2">
                {projects.map((bot) => (
                    <div key={bot.name} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-card/80 backdrop-blur-lg border border-border rounded-lg gap-4">
                        <div className="flex-1 min-w-0 w-full">
                           <div className="flex items-center gap-3">
                                <Badge
                                    variant={bot.status === 'running' ? 'default' : 'secondary'}
                                    className={`h-6 text-xs ${bot.status === 'running' ? 'bg-green-500/80 hover:bg-green-600/80 border-green-400' : 'bg-muted/80'}`}
                                >
                                    {bot.status === 'running' ? (
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                    ) : (
                                        <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    {bot.status === 'running' ? 'Online' : 'Offline'}
                                </Badge>
                                <span className="font-semibold truncate">{bot.name}</span>
                            </div>
                             <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                 {bot.status === 'running' && bot.expiresAt && (
                                    <div className="flex items-center gap-1.5 font-mono">
                                        <Clock className="h-3 w-3" />
                                        <CountdownTimer expiryTimestamp={bot.expiresAt} />
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <CpuIcon className="h-3 w-3" />
                                    <span>{bot.cpu || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MemoryStickIcon className="h-3 w-3" />
                                    <span>{bot.memory || 'N/A'}</span>
                                </div>
                             </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 w-full sm:w-auto">
                             <Button
                                size="sm"
                                variant={bot.status === 'running' ? 'destructive' : 'default'}
                                onClick={() => handleAction(bot.status === 'running' ? 'stop' : 'run', bot.name)}
                                disabled={isLoading[bot.name]}
                                className={cn("w-1/5 sm:w-auto text-xs", bot.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700')}
                            >
                                {bot.status === 'running' ? <StopCircle /> : <Play />}
                                <span className="hidden sm:inline ml-1">{bot.status === 'running' ? 'Stop' : 'Start'}</span>
                            </Button>
                            <Button size="sm" variant="outline" className="w-1/5 sm:w-auto text-xs" asChild>
                                <Link href={`/dashboard/bots/${bot.name}`}>
                                    <Terminal />
                                    <span className="hidden sm:inline ml-1">Console</span>
                                </Link>
                            </Button>
                             <Button size="sm" variant="outline" className="w-1/5 sm:w-auto text-xs" asChild>
                                <Link href={`/dashboard/bots/${bot.name}/files`}>
                                    <Folder />
                                     <span className="hidden sm:inline ml-1">Files</span>
                                </Link>
                            </Button>
                             <Button size="sm" variant="outline" className="w-1/5 sm:w-auto text-xs" asChild>
                                <Link href={`/dashboard/bots/${bot.name}/settings`}>
                                    <Settings />
                                     <span className="hidden sm:inline ml-1">Settings</span>
                                </Link>
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive w-1/5 sm:w-auto" onClick={() => openDeleteDialog(bot.name)}>
                                <Trash2 />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle>Confirm Deletion</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the project '{selectedBot}'? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDelete}>Confirm Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

        </div>
    );
}

