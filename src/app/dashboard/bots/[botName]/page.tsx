// This is a placeholder file. The content will be implemented in the next steps.
"use client"
import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Play, StopCircle, Trash2, Upload, FilePlus, FolderPlus, Terminal, ChevronRight, Edit, Save } from 'lucide-react';
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BotDetailPage({ params }: { params: { botName: string } }) {
    const { botName } = params;
    const [currentPath, setCurrentPath] = useState('.');
    const { data: filesData, error: filesError, mutate: mutateFiles } = useSWR(`/api/files/${botName}?path=${encodeURIComponent(currentPath)}`, fetcher);
    
    const [logs, setLogs] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { toast } = useToast();
    
    // Dialog states
    const [isCreateFileDialogOpen, setCreateFileDialogOpen] = useState(false);
    const [isCreateFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isRenameDialogOpen, setRenameDialogOpen] = useState(false);
    const [isEditorOpen, setEditorOpen] = useState(false);

    // Form/Action states
    const [newItemName, setNewItemName] = useState('');
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [itemToRename, setItemToRename] = useState<any>(null);
    const [fileToEdit, setFileToEdit] = useState<any>(null);
    const [fileContent, setFileContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);


    useEffect(() => {
        const settingsRef = ref(db, 'admin/serverSettings/activeApiUrl');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            const url = snapshot.val();
            setActiveApiUrl(url || "https://cfgnnn-production.up.railway.app");
        });
        return () => unsubscribe();
    }, []);

    const { data: statusData, mutate: mutateStatus } = useSWR('/api/scripts', (url) => fetcher(url).then(data => {
        const botStatus = data.scripts.find((s: any) => s.name === botName);
        setIsRunning(botStatus?.status === 'running');
        return botStatus;
    }), { refreshInterval: 3000 });
    
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
        setIsLoading(true);
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
                setIsLoading(false);
            }, 1500);
        }
    };
    
    const handleFileClick = (file: any) => {
        if (file.type === 'directory') {
            const newPath = currentPath === '.' ? file.name : `${currentPath}/${file.name}`;
            setCurrentPath(newPath);
        } else {
            openEditor(file);
        }
    };

    const handleBackClick = () => {
        const pathParts = currentPath.split('/');
        pathParts.pop();
        setCurrentPath(pathParts.length > 0 ? pathParts.join('/') : '.');
    };

    const handleUpload = async () => {
        if (!uploadedFiles) return;
        const formData = new FormData();
        formData.append('botName', botName);
        formData.append('currentPath', currentPath);
        for (let i = 0; i < uploadedFiles.length; i++) {
            formData.append('files', uploadedFiles[i]);
        }

        try {
            const res = await fetch('/api/files/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: "สำเร็จ", description: data.message });
            mutateFiles();
            setUploadedFiles(null); // Clear selection
            const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
            if(fileInput) fileInput.value = "";
        } catch (err: any) {
            toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: "destructive" });
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
            mutateFiles();
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
            mutateFiles();
        } catch (err: any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };
    
    const confirmRename = async () => {
        if (!itemToRename) return;
        try {
            const res = await fetch('/api/files/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, oldPath: itemToRename.path, newName: newItemName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            toast({ title: 'สำเร็จ', description: `เปลี่ยนชื่อเป็น ${newItemName} สำเร็จ` });
            mutateFiles();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setRenameDialogOpen(false);
            setItemToRename(null);
            setNewItemName('');
        }
    };
    
    const openEditor = async (file: any) => {
        setFileToEdit(file);
        try {
             const res = await fetch(`/api/file/content?botName=${botName}&fileName=${encodeURIComponent(file.path)}`);
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             setFileContent(data.content);
             setEditorOpen(true);
        } catch (err: any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: `ไม่สามารถเปิดไฟล์ได้: ${err.message}`, variant: 'destructive' });
        }
    };

    const saveFile = async () => {
        if (!fileToEdit) return;
        setIsSaving(true);
        try {
             const res = await fetch('/api/file/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, fileName: fileToEdit.path, content: fileContent })
             });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             toast({ title: 'สำเร็จ', description: 'บันทึกไฟล์เรียบร้อยแล้ว' });
             setEditorOpen(false);
        } catch (err: any) {
             toast({ title: 'เกิดข้อผิดพลาด', description: `ไม่สามารถบันทึกไฟล์ได้: ${err.message}`, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }


    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                            <span className="truncate">Console Log: {botName}</span>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button size="sm" variant="outline" onClick={() => handleAction('run')} disabled={isRunning || isLoading}>
                                    <Play className="mr-2 h-4 w-4" /> เริ่ม
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleAction('stop')} disabled={!isRunning || isLoading}>
                                    <StopCircle className="mr-2 h-4 w-4" /> หยุด
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] md:h-[500px] w-full rounded-md border bg-black text-white font-mono text-sm p-4" ref={logContainerRef}>
                            <pre><code>{logs}</code></pre>
                        </ScrollArea>
                        <div className="relative mt-2">
                            <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="พิมพ์คำสั่ง..."
                                className="w-full pl-10 pr-4 py-2 rounded-md border bg-background"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && ws.current && ws.current.readyState === WebSocket.OPEN) {
                                        ws.current.send(JSON.stringify({ type: 'input', data: (e.target as HTMLInputElement).value }));
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>File Manager</span>
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCreateFolderDialogOpen(true)}><FolderPlus className="h-4 w-4" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setCreateFileDialogOpen(true)}><FilePlus className="h-4 w-4" /></Button>
                                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => document.getElementById('file-upload-input')?.click()}><Upload className="h-4 w-4" /></Button>
                                <input id="file-upload-input" type="file" multiple className="hidden" onChange={(e) => setUploadedFiles(e.target.files)} />
                            </div>
                        </CardTitle>
                         <div className="text-sm text-muted-foreground px-6 pt-2 truncate">
                            Path: {currentPath}
                         </div>
                         {uploadedFiles && uploadedFiles.length > 0 && (
                            <div className="px-6 pt-2">
                                <p className="text-sm">{uploadedFiles.length} file(s) selected.</p>
                                <Button size="sm" onClick={handleUpload} className="mt-2">อัปโหลด</Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] md:h-[530px] w-full rounded-md border p-2">
                            {filesError && <div className="text-destructive p-2">ไม่สามารถโหลดไฟล์ได้</div>}
                            {!filesData && !filesError && <div className="p-2">กำลังโหลด...</div>}
                            <ul>
                                {currentPath !== '.' && (
                                     <li key=".." className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer" onClick={handleBackClick}>
                                        <ChevronRight className="h-4 w-4 mr-2 transform rotate-180" />
                                        <span>..</span>
                                     </li>
                                )}
                                {filesData?.files.map((file: any) => (
                                    <li key={file.name} className="flex items-center justify-between p-2 hover:bg-muted rounded-md group">
                                       <span className="flex items-center gap-2 cursor-pointer" onClick={() => handleFileClick({ ...file, path: currentPath === '.' ? file.name : `${currentPath}/${file.name}` })}>
                                          {file.type === 'directory' ? <FolderPlus className="h-4 w-4 text-primary" /> : <FilePlus className="h-4 w-4 text-secondary-foreground" />}
                                          {file.name}
                                       </span>
                                       <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setItemToRename({ ...file, path: currentPath === '.' ? file.name : `${currentPath}/${file.name}` }); setRenameDialogOpen(true); }}>
                                               <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setItemToDelete({ ...file, path: currentPath === '.' ? file.name : `${currentPath}/${file.name}` }); setDeleteDialogOpen(true); }}>
                                               <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                       </div>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Dialogs */}
            <Dialog open={isCreateFileDialogOpen} onOpenChange={setCreateFileDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>สร้างไฟล์ใหม่</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="file-name">ชื่อไฟล์</Label><Input id="file-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setCreateFileDialogOpen(false)}>ยกเลิก</Button><Button onClick={() => handleCreate('file')}>สร้าง</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isCreateFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="folder-name">ชื่อโฟลเดอร์</Label><Input id="folder-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>ยกเลิก</Button><Button onClick={() => handleCreate('folder')}>สร้าง</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>ยืนยันการลบ</DialogTitle><DialogDescription>คุณแน่ใจหรือไม่ว่าต้องการลบ '{itemToDelete?.name}'? การกระทำนี้ไม่สามารถย้อนกลับได้</DialogDescription></DialogHeader>
                    <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button><Button variant="destructive" onClick={confirmDelete}>ยืนยันการลบ</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isRenameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle>เปลี่ยนชื่อ</DialogTitle></DialogHeader>
                    <div className="py-4"><Label htmlFor="new-name">ชื่อใหม่สำหรับ '{itemToRename?.name}'</Label><Input id="new-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} /></div>
                    <DialogFooter><Button variant="outline" onClick={() => setRenameDialogOpen(false)}>ยกเลิก</Button><Button onClick={confirmRename}>บันทึก</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* File Editor Dialog */}
            <Dialog open={isEditorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>แก้ไขไฟล์: {fileToEdit?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow py-4">
                        <Textarea 
                            value={fileContent} 
                            onChange={e => setFileContent(e.target.value)} 
                            className="w-full h-full font-mono text-sm"
                            placeholder="File content..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditorOpen(false)}>ยกเลิก</Button>
                        <Button onClick={saveFile} disabled={isSaving}>
                            {isSaving ? 'กำลังบันทึก...' : <><Save className="mr-2 h-4 w-4"/>บันทึก</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    