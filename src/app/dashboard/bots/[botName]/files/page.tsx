
"use client"

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Folder, FileText, MoreVertical, Trash2, Edit, Plus, Upload, ArrowLeft, FilePlus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const fetcher = (url: string) => fetch(url).then((res) => res.json());

type FileOrFolder = {
  name: string;
  type: 'file' | 'directory';
};

export default function FileManagerPage() {
    const params = useParams();
    const router = useRouter();
    const botName = params.botName as string;
    const [currentPath, setCurrentPath] = useState('.');
    const [userId, setUserId] = useState<string | null>(null);
    const { toast } = useToast();
    const { data, error, mutate } = useSWR(userId ? `/api/files/${botName}?path=${encodeURIComponent(currentPath)}&userId=${userId}` : null, fetcher);

    // State for dialogs
    const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);
    const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

    // State for inputs
    const [newFileName, setNewFileName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
    const [itemToRename, setItemToRename] = useState<FileOrFolder | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        }
    }, []);
    
    const handleItemClick = (item: FileOrFolder) => {
        const newPath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
        
        if (item.type === 'directory') {
            setCurrentPath(newPath);
        } else {
            router.push(`/dashboard/bots/${botName}/files/editor?filePath=${encodeURIComponent(newPath)}`);
        }
    };
    
    const handleGoBack = () => {
        if (currentPath === '.') {
            router.push('/dashboard/bots');
        } else {
            const newPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '.';
            setCurrentPath(newPath);
        }
    };
    
    const sortedFiles = data?.files?.sort((a: FileOrFolder, b: FileOrFolder) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });

    // --- API Call Handlers ---

    const handleCreateFile = async () => {
        if (!newFileName || !userId) return;
        try {
            const res = await fetch('/api/files/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, userId, currentPath, fileName: newFileName }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            toast({ title: 'สำเร็จ', description: result.message });
            mutate();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setIsCreateFileDialogOpen(false);
            setNewFileName('');
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName || !userId) return;
        try {
            const res = await fetch('/api/files/create-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, userId, currentPath, folderName: newFolderName }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            toast({ title: 'สำเร็จ', description: result.message });
            mutate();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setIsCreateFolderDialogOpen(false);
            setNewFolderName('');
        }
    };
    
    const handleUpload = async () => {
        if (!filesToUpload || filesToUpload.length === 0 || !userId) return;
        const formData = new FormData();
        formData.append('botName', botName);
        formData.append('userId', userId);
        formData.append('currentPath', currentPath);
        for (let i = 0; i < filesToUpload.length; i++) {
            formData.append('files', filesToUpload[i]);
        }

        try {
            const res = await fetch('/api/files/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            toast({ title: 'สำเร็จ', description: result.message });
            mutate();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setIsUploadDialogOpen(false);
            setFilesToUpload(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    
    const handleDelete = async (item: FileOrFolder) => {
        const fullItemPath = currentPath === '.' ? item.name : `${currentPath}/${item.name}`;
        if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ '${item.name}'? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;

        try {
            const res = await fetch('/api/files/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, userId, filePath: fullItemPath }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            toast({ title: 'สำเร็จ', description: result.message });
            mutate();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        }
    };

    const handleRename = async () => {
        if (!itemToRename || !newItemName || !userId) return;
        const oldFullPath = currentPath === '.' ? itemToRename.name : `${currentPath}/${itemToRename.name}`;

        try {
            const res = await fetch('/api/files/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, userId, oldPath: oldFullPath, newName: newItemName }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            toast({ title: 'สำเร็จ', description: result.message });
            mutate();
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setIsRenameDialogOpen(false);
            setNewItemName('');
            setItemToRename(null);
        }
    };
    
    const openRenameDialog = (item: FileOrFolder) => {
        setItemToRename(item);
        setNewItemName(item.name);
        setIsRenameDialogOpen(true);
    };

    return (
        <div className="flex flex-col h-full text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <Button variant="ghost" size="icon" className="mr-4" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">ไฟล์ใน: {botName}/{currentPath === '.' ? '' : currentPath}</h1>
            </header>
            
            <main className="flex-1 p-4 overflow-auto">
                 <Card className="bg-card/80 backdrop-blur-lg border-border">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-white">Name</TableHead>
                                    <TableHead className="text-right text-white"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {error && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-destructive">
                                            Could not load files.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!data && !error && (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                )}
                                {sortedFiles?.map((item: FileOrFolder) => (
                                    <TableRow key={item.name} className="cursor-pointer hover:bg-muted/20" onClick={() => handleItemClick(item)}>
                                        <TableCell className="flex items-center gap-3">
                                            {item.type === 'directory' ? <Folder className="h-5 w-5 text-primary" /> : <FileText className="h-5 w-5 text-gray-400" />}
                                            <span>{item.name}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuItem onClick={() => openRenameDialog(item)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Rename</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item)}>
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
            </main>

            {/* --- Dialogs --- */}

            {/* Create File Dialog */}
            <Dialog open={isCreateFileDialogOpen} onOpenChange={setIsCreateFileDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้างไฟล์ใหม่</DialogTitle>
                        <DialogDescription>ป้อนชื่อไฟล์ใหม่ที่คุณต้องการสร้างในโฟลเดอร์ปัจจุบัน</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="file-name">ชื่อไฟล์ (เช่น index.js)</Label>
                        <Input id="file-name" value={newFileName} onChange={e => setNewFileName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateFileDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleCreateFile}>สร้างไฟล์</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>สร้างโฟลเดอร์ใหม่</DialogTitle>
                        <DialogDescription>ป้อนชื่อโฟลเดอร์ใหม่ที่คุณต้องการสร้าง</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="folder-name">ชื่อโฟลเดอร์</Label>
                        <Input id="folder-name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleCreateFolder}>สร้างโฟลเดอร์</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Upload Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>อัปโหลดไฟล์</DialogTitle>
                        <DialogDescription>เลือกไฟล์จากเครื่องของคุณเพื่ออัปโหลดมายังโฟลเดอร์ปัจจุบัน</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="upload-files">เลือกไฟล์</Label>
                        <Input id="upload-files" type="file" multiple onChange={e => setFilesToUpload(e.target.files)} ref={fileInputRef}/>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleUpload}>อัปโหลด</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Rename Dialog */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>เปลี่ยนชื่อ '{itemToRename?.name}'</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new-item-name">ชื่อใหม่</Label>
                        <Input id="new-item-name" value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleRename}>บันทึก</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <footer className="p-4 border-t border-gray-800 grid grid-cols-3 gap-2">
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10" onClick={() => setIsCreateFileDialogOpen(true)}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    สร้างไฟล์
                </Button>
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10" onClick={() => setIsCreateFolderDialogOpen(true)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    สร้างโฟลเดอร์
                </Button>
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10" onClick={() => setIsUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    อัปโหลด
                </Button>
            </footer>
        </div>
    );

    