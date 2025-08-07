
"use client"

import { useState, useEffect } from 'react';
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type FileOrFolder = {
  name: string;
  type: 'file' | 'directory';
  path: string;
};

export default function FileManagerPage() {
    const params = useParams();
    const router = useRouter();
    const botName = params.botName as string;
    const [currentPath, setCurrentPath] = useState('.');
    
    const { data, error, mutate } = useSWR(`/api/files/${botName}?path=${encodeURIComponent(currentPath)}`, fetcher);
    const { toast } = useToast();

    const handleItemClick = (item: FileOrFolder) => {
        if (item.type === 'directory') {
            setCurrentPath(item.path);
        } else {
            router.push(`/dashboard/bots/${botName}/files/editor?filePath=${encodeURIComponent(item.path)}`);
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

    return (
        <div className="flex flex-col h-full text-white">
            <header className="flex items-center p-4 border-b border-gray-800">
                <Button variant="ghost" size="icon" className="mr-4" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">ไฟล์ใน: {botName}</h1>
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
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Rename</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive">
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

            <footer className="p-4 border-t border-gray-800 grid grid-cols-3 gap-2">
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10">
                    <FilePlus className="mr-2 h-4 w-4" />
                    สร้างไฟล์
                </Button>
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    สร้างโฟลเดอร์
                </Button>
                 <Button variant="outline" className="bg-transparent hover:bg-primary/10">
                    <Upload className="mr-2 h-4 w-4" />
                    อัปโหลด
                </Button>
            </footer>
        </div>
    );
}
