
"use client"
import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Play, StopCircle, Trash2, Upload, FilePlus, FolderPlus, Terminal, ChevronRight, Edit, Save, HardDrive, Cpu, Gauge, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatUptime(startTime: number | undefined): string {
    if (!startTime) return '00h 00m 00s';
    const now = Date.now();
    let seconds = Math.floor((now - startTime) / 1000);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function BotDetailClient({ botName }: { botName: string }) {
    const [currentPath, setCurrentPath] = useState('.');
    
    const [logs, setLogs] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null);
    const { toast } = useToast();
    
    const [isFileManagerOpen, setFileManagerOpen] = useState(false);
    const [isCreateFileDialogOpen, setCreateFileDialogOpen] = useState(false);
    const [isCreateFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [newItemName, setNewItemName] = useState('');
    const [itemToDelete, setItemToDelete] = useState<any>(null);

    const { data: statusData, mutate: mutateStatus } = useSWR(`/api/scripts`, (url) => fetcher(url).then(data => {
        return data.scripts.find((s: any) => s.name === botName);
    }), { refreshInterval: 2000 });

    const [uptime, setUptime] = useState(formatUptime(statusData?.startTime));

    useEffect(() => {
        const settingsRef = ref(db, 'admin/serverSettings/activeApiUrl');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            const url = snapshot.val();
            setActiveApiUrl(url || "https://cfgnnn-production.up.railway.app");
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (statusData?.status === 'running') {
            const interval = setInterval(() => {
                setUptime(formatUptime(statusData.startTime));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setUptime(formatUptime(undefined));
        }
    }, [statusData]);
    
    useEffect(() => {
        if (!activeApiUrl) return;

        fetch(`/api/logs/${botName}`)
            .then(res => res.json())
            .then(data => setLogs(data.logs || 'ยังไม่มี Log สำหรับโปรเจกต์นี้\n'));

        try {
            const serverUrl = new URL(activeApiUrl);
            const wsProtocol = serverUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${serverUrl.host}`;
            
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => ws.current?.send(JSON.stringify({ type: 'connect', botName }));
            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'log') setLogs(prev => prev + message.data);
                    else if (message.type === 'exit') setLogs(prev => prev + `\n[System] โปรเจกต์หยุดทำงานด้วย exit code ${message.code}.\n`);
                } catch (e) {
                     setLogs(prev => prev + event.data);
                }
            };
            ws.current.onclose = () => setLogs(prev => prev + '\n[System] การเชื่อมต่อกับเซิร์ฟเวอร์ถูกตัด\n');
            ws.current.onerror = (error) => setLogs(prev => prev + '\n[System] เกิดข้อผิดพลาดในการเชื่อมต่อ WebSocket\n');
        } catch (error) {
            setLogs(prev => prev + '\n[System] URL ของ API ไม่ถูกต้อง ไม่สามารถสร้างการเชื่อมต่อ WebSocket ได้\n');
        }

        return () => ws.current?.close();
    }, [botName, activeApiUrl]);

    useEffect(() => {
        if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }, [logs]);

    const handleAction = async (action: 'run' | 'stop') => {
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
                mutateStatus();
            }, 1500);
        }
    };
    
    const handleCreate = async (type: 'file' | 'folder') => {
        const endpoint = type === 'file' ? '/api/files/create' : '/api/files/create-folder';
        const body = {
            botName,
            currentPath,
            [type === 'file' ? 'fileName' : 'folderName']: newItemName
        };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: 'สำเร็จ', description: `สร้าง ${newItemName} สำเร็จ` });
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setCreateFileDialogOpen(false);
            setCreateFolderDialogOpen(false);
            setNewItemName('');
        }
    };
    
    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await fetch('/api/files/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, filePath: itemToDelete.path })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: 'สำเร็จ', description: `ลบ ${itemToDelete.name} สำเร็จ` });
        } catch (err: any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };
    
    const isRunning = statusData?.status === 'running';

    return (
        <div className="flex flex-col h-full p-0 m-0">
             <Card className="flex-grow flex flex-col w-full max-w-4xl mx-auto bg-card/80 backdrop-blur-lg border-border rounded-2xl overflow-hidden">
                <CardHeader className="p-4 border-b border-border/50">
                    <div className="flex items-center gap-4">
                         <Button 
                            size="icon" 
                            variant="ghost" 
                            className={cn(
                                "h-12 w-12 rounded-full",
                                isRunning ? "bg-red-500/80 hover:bg-red-600/80 text-white" : "bg-green-500/80 hover:bg-green-600/80 text-white"
                            )}
                            onClick={() => handleAction(isRunning ? 'stop' : 'run')}
                        >
                            {isRunning ? <StopCircle className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                        </Button>
                        <div>
                            <CardTitle className="text-lg font-bold">{botName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{uptime}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col gap-4">
                     <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-background/30 p-2 rounded-lg">
                            <Cpu className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-lg font-semibold">{statusData?.cpu || '0.0'}%</p>
                            <p className="text-xs text-muted-foreground">ซีพียู</p>
                        </div>
                        <div className="bg-background/30 p-2 rounded-lg">
                            <HardDrive className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-lg font-semibold">{statusData?.memory || '0.0'}MB</p>
                            <p className="text-xs text-muted-foreground">แรม</p>
                        </div>
                        <div className="bg-background/30 p-2 rounded-lg">
                            <Gauge className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                            <p className="text-lg font-semibold">{statusData?.ping || '0'}ms</p>
                            <p className="text-xs text-muted-foreground">ปิง</p>
                        </div>
                    </div>
                    <ScrollArea className="flex-grow bg-black/50 rounded-md text-white font-mono text-sm" ref={logContainerRef}>
                        <pre className="p-4"><code>{logs}</code></pre>
                    </ScrollArea>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="พิมพ์คำสั่ง ..."
                            className="w-full pl-4 pr-12 py-2 rounded-lg border bg-background/50 h-12 text-base"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && ws.current && ws.current.readyState === WebSocket.OPEN) {
                                    ws.current.send(JSON.stringify({ type: 'input', data: (e.target as HTMLInputElement).value }));
                                    (e.target as HTMLInputElement).value = '';
                                }
                            }}
                        />
                         <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary hover:bg-primary/90 rounded-md">
                            <Send className="h-5 w-5"/>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
             <Dialog open={isFileManagerOpen} onOpenChange={setFileManagerOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card/90 backdrop-blur-lg border-border">
                    <DialogHeader>
                        <DialogTitle>File Manager: {botName}</DialogTitle>
                        <DialogDescription>{currentPath}</DialogDescription>
                    </DialogHeader>
                    {/* File Manager content will be implemented here */}
                    <div className="flex-grow py-4 border rounded-md">
                        <p className="text-center p-8">File manager functionality coming soon!</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFileManagerOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isCreateFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-lg border-border"><DialogHeader><DialogTitle>สร้างไฟล์ใหม่</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="file-name">ชื่อไฟล์</Label><Input id="file-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setCreateFileDialogOpen(false)}>ยกเลิก</Button><Button onClick={() => handleCreate('file')}>สร้าง</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isCreateFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-lg border-border"><DialogHeader><DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="folder-name">ชื่อโฟลเดอร์</Label><Input id="folder-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>ยกเลิก</Button><Button onClick={() => handleCreate('folder')}>สร้าง</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-card/90 backdrop-blur-lg border-border">
                    <DialogHeader><DialogTitle>ยืนยันการลบ</DialogTitle><DialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์ '{botName}'? การกระทำนี้ไม่สามารถย้อนกลับได้ และจะลบไฟล์ทั้งหมด</DialogDescription></DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
                        <Button variant="destructive" onClick={async () => {
                             try {
                                const res = await fetch(`/api/scripts/${botName}`, { method: 'DELETE' });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message);
                                toast({ title: 'สำเร็จ', description: `ลบ ${botName} สำเร็จ` });
                                window.history.back(); // Go back to the previous page
                            } catch (err: any) {
                                toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
                            } finally {
                                setDeleteDialogOpen(false);
                            }
                        }}>ยืนยันการลบ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function BotDetailPage({ params }: { params: { botName: string } }) {
    return <BotDetailClient botName={params.botName} />;
}
