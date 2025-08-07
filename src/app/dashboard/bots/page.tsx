
"use client"

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Bot, MoreHorizontal, Play, StopCircle, Trash2, CheckCircle, XCircle, Package, Terminal, GitBranch, Upload, FileCode, HardDrive, File, Folder, Settings } from 'lucide-react';
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


const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BotsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const { data, error, mutate } = useSWR(userId ? `/api/scripts?userId=${userId}` : null, fetcher, { refreshInterval: 3000 });
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [selectedBot, setSelectedBot] = useState<string | null>(null);
    const [moduleName, setModuleName] = useState('');
    const [newBotName, setNewBotName] = useState('');
    const [gitUrl, setGitUrl] = useState('');
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [createError, setCreateError] = useState<string | null>(null);
    const { toast } = useToast();

     useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        } else {
            // Handle case where user is not logged in
        }
    }, []);

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
            toast({ title: 'สำเร็จ', description: data.message });
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
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
        if (!selectedBot || !userId) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
            const res = await fetch(`/api/scripts/${selectedBot}?userId=${userId}`, { method: 'DELETE' });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
            toast({ title: 'สำเร็จ', description: `ลบโปรเจกต์ ${selectedBot} สำเร็จ` });
        } catch (err:any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
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
        if (!selectedBot || !moduleName || !userId) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
             const res = await fetch(`/api/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName: selectedBot, module: moduleName, userId: userId }),
            });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             toast({ title: "ส่งคำสั่งแล้ว", description: data.message });
        } catch (err: any) {
             toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(prev => ({ ...prev, [selectedBot]: false }));
            setIsInstallDialogOpen(false);
            setModuleName('');
        }
    };

    const handleCreateProject = async (creationMethod: 'empty' | 'git' | 'zip') => {
        if (!userId) {
            toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถระบุผู้ใช้ได้ กรุณาล็อกอินใหม่อีกครั้ง', variant: 'destructive' });
            return;
        }
        setIsLoading(prev => ({ ...prev, create: true }));
        setCreateError(null);
        const formData = new FormData();
        formData.append('botName', newBotName);
        formData.append('creationMethod', creationMethod);
        formData.append('userId', userId);

        if (creationMethod === 'git') {
            formData.append('gitUrl', gitUrl);
        } else if (creationMethod === 'zip' && zipFile) {
            formData.append('file', zipFile);
        }

        try {
            const res = await fetch('/api/upload/project', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || 'เกิดข้อผิดพลาดในการสร้างโปรเจกต์');
            }
            toast({ title: "สำเร็จ", description: result.message });
            setIsCreateDialogOpen(false);
            setNewBotName('');
            setGitUrl('');
            setZipFile(null);
            mutate();
        } catch (err: any) {
            setCreateError(err.message);
        } finally {
            setIsLoading(prev => ({ ...prev, create: false }));
        }
    };

    return (
        <div className="space-y-6">
             <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-14 w-14 fixed bottom-8 right-8 z-20 shadow-lg">
                        <PlusCircle className="h-8 w-8" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px] bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Choose a method to create your project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bot-name" className="text-right">Project Name</Label>
                            <Input id="bot-name" value={newBotName} onChange={(e) => setNewBotName(e.target.value)} className="col-span-3" placeholder="my-awesome-bot" />
                        </div>
                    </div>
                    <Tabs defaultValue="empty" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="empty"><FileCode className="mr-2 h-4 w-4" />Empty</TabsTrigger>
                            <TabsTrigger value="git"><GitBranch className="mr-2 h-4 w-4" />Git</TabsTrigger>
                            <TabsTrigger value="zip"><Upload className="mr-2 h-4 w-4" />ZIP</TabsTrigger>
                        </TabsList>
                        <TabsContent value="empty">
                             <Card className="bg-transparent border-0 shadow-none">
                                <CardContent className="pt-6">
                                    <div className="text-sm text-muted-foreground">
                                        <p>Create a blank project. You will need to add files later.</p>
                                    </div>
                                     <DialogFooter className="mt-4">
                                        <Button type="button" onClick={() => handleCreateProject('empty')} disabled={isLoading['create'] || !newBotName}>
                                            {isLoading['create'] ? 'Creating...' : 'Create Project'}
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
                                        <Button type="button" onClick={() => handleCreateProject('git')} disabled={isLoading['create'] || !newBotName || !gitUrl}>
                                            {isLoading['create'] ? 'Cloning...' : 'Clone Project'}
                                        </Button>
                                    </DialogFooter>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="zip">
                             <Card className="bg-transparent border-0 shadow-none">
                                <CardContent className="pt-6 space-y-4">
                                    <div>
                                        <Label htmlFor="zip-file">Upload .zip file</Label>
                                        <Input id="zip-file" type="file" accept=".zip" onChange={e => setZipFile(e.target.files?.[0] || null)} />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" onClick={() => handleCreateProject('zip')} disabled={isLoading['create'] || !newBotName || !zipFile}>
                                            {isLoading['create'] ? 'Uploading...' : 'Create from ZIP'}
                                        </Button>
                                    </DialogFooter>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                    {createError && <p className="text-sm text-destructive mt-2">{createError}</p>}
                </DialogContent>
            </Dialog>

            {error && <p className="text-destructive text-center">Could not load project data.</p>}
            {!data && !error && <p className="text-muted-foreground text-center">Loading projects...</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data?.scripts?.map((bot: any) => (
                    <Card key={bot.name} className="flex flex-col bg-card/80 backdrop-blur-lg border-border">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-start">
                                <span className="truncate pr-4">{bot.name}</span>
                                <Badge
                                    variant={bot.status === 'running' ? 'default' : 'secondary'}
                                    className={`text-xs ${bot.status === 'running' ? 'bg-green-500/80 hover:bg-green-600/80 border-green-400' : 'bg-muted/80'}`}
                                >
                                    {bot.status === 'running' ? (
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                    ) : (
                                        <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    {bot.status === 'running' ? 'Online' : 'Offline'}
                                </Badge>
                            </CardTitle>
                             <CardDescription>
                                <Badge variant="outline" className="text-xs font-mono">{bot.type || 'unknown'}</Badge>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <CpuIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground text-xs">CPU</p>
                                    <p className="font-semibold">{bot.cpu || 'N/A'}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-2">
                                <MemoryStickIcon className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-muted-foreground text-xs">Memory</p>
                                    <p className="font-semibold">{bot.memory ? `${bot.memory} MB` : 'N/A'}</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="grid grid-cols-3 gap-2 p-3">
                             <div className="col-span-3 flex justify-between items-center gap-1">
                                <Button
                                    size="sm"
                                    variant={bot.status === 'running' ? 'destructive' : 'default'}
                                    onClick={() => handleAction(bot.status === 'running' ? 'stop' : 'run', bot.name)}
                                    disabled={isLoading[bot.name]}
                                    className={`w-full text-xs ${bot.status === 'running' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {bot.status === 'running' ? <StopCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                    <span className="ml-1">{bot.status === 'running' ? 'Stop' : 'Start'}</span>
                                </Button>
                                <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                                    <Link href={`/dashboard/bots/${bot.name}`}>
                                        <Terminal className="h-4 w-4" />
                                        <span className="ml-1">Console</span>
                                    </Link>
                                </Button>
                             </div>
                             <div className="col-span-3 flex justify-between items-center gap-1">
                                <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                                    <Link href={`/dashboard/bots/${bot.name}/files`}>
                                        <Folder className="h-4 w-4" />
                                        <span className="ml-1">Files</span>
                                    </Link>
                                </Button>
                                <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                                    <Link href={`/dashboard/bots/${bot.name}/settings`}>
                                        <Settings className="h-4 w-4" />
                                        <span className="ml-1">Settings</span>
                                    </Link>
                                </Button>
                                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => openInstallDialog(bot.name)}>
                                    <Package className="h-4 w-4" />
                                    <span className="ml-1">Install</span>
                                </Button>
                                <Button size="sm" variant="ghost" className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteDialog(bot.name)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
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

            <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>Install Dependencies for '{selectedBot}'</DialogTitle>
                        <DialogDescription>
                            Enter the name of the module to install (e.g., express, discord.js).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                       <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="module-name" className="text-right">
                           Module
                         </Label>
                         <Input
                           id="module-name"
                           value={moduleName}
                           onChange={(e) => setModuleName(e.target.value)}
                           className="col-span-3"
                           placeholder="e.g., discord.js"
                         />
                       </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => { setIsInstallDialogOpen(false); setModuleName(''); }}>Cancel</Button>
                         <Button onClick={confirmInstall}>Install</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
