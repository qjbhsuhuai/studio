
"use client"

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Bot, MoreHorizontal, Play, StopCircle, Trash2, CheckCircle, XCircle, Package, Terminal, GitBranch, Upload, FileCode } from 'lucide-react';
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


const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BotsPage() {
    const { data, error, mutate } = useSWR('/api/scripts', fetcher, { refreshInterval: 3000 });
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
    const { toast } = useToast()

    const handleAction = async (action: 'run' | 'stop', botName: string) => {
        setIsLoading(prev => ({ ...prev, [botName]: true }));
        try {
            const res = await fetch(`/api/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: botName }),
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
        if (!selectedBot) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
            const res = await fetch(`/api/scripts/${selectedBot}`, { method: 'DELETE' });
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
        if (!selectedBot || !moduleName) return;
        setIsLoading(prev => ({ ...prev, [selectedBot]: true }));
        try {
             const res = await fetch(`/api/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName: selectedBot, module: moduleName }),
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
        setIsLoading(prev => ({ ...prev, create: true }));
        setCreateError(null);
        const formData = new FormData();
        formData.append('botName', newBotName);
        formData.append('creationMethod', creationMethod);

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
    
    const { data: envData } = useSWR('/api/environment', fetcher);


    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h1 className="text-lg font-semibold text-white">ทำงานบน: {envData?.detail || 'Loading...'}</h1>
                    </div>
                </div>
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
            </div>

            <Card className="bg-card/80 backdrop-blur-lg border-border">
                <CardHeader>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>
                        All available projects in the system.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>CPU</TableHead>
                                <TableHead>Memory</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {error && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-destructive">
                                        Could not load project data.
                                    </TableCell>
                                </TableRow>
                            )}
                            {!data && !error && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            )}
                            {data?.scripts.map((bot: any) => (
                                <TableRow key={bot.name}>
                                    <TableCell>
                                        <Badge
                                            variant={bot.status === 'running' ? 'default' : 'secondary'}
                                            className={bot.status === 'running' ? 'bg-green-500/80 hover:bg-green-600/80 border-green-400' : 'bg-muted/80'}
                                        >
                                            {bot.status === 'running' ? (
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                            ) : (
                                                <XCircle className="mr-1 h-3 w-3" />
                                            )}
                                            {bot.status === 'running' ? 'Online' : 'Offline'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-medium">{bot.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{bot.type}</Badge>
                                    </TableCell>
                                    <TableCell>{bot.cpu || 'N/A'}</TableCell>
                                    <TableCell>{bot.memory ? `${bot.memory} MB` : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" disabled={isLoading[bot.name]}>
                                                    {isLoading[bot.name] ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <MoreHorizontal className="h-4 w-4" />}
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleAction(bot.status === 'running' ? 'stop' : 'run', bot.name)}>
                                                    {bot.status === 'running' ? <><StopCircle className="mr-2 h-4 w-4" /><span>Stop</span></> : <><Play className="mr-2 h-4 w-4" /><span>Start</span></>}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/bots/${bot.name}`}>
                                                        <Terminal className="mr-2 h-4 w-4" />
                                                        Manage
                                                    </Link>
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => openInstallDialog(bot.name)}>
                                                    <Package className="mr-2 h-4 w-4" />
                                                    <span>Install Dependencies</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(bot.name)}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>Delete</span>
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
