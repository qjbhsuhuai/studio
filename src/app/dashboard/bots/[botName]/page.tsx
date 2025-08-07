
"use client"
import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Play, StopCircle, Package, Settings, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"


const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatUptime(startTime: number | undefined): string {
    if (!startTime) return '00:00:00';
    const now = Date.now();
    let totalSeconds = Math.floor((now - startTime) / 1000);
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const AnsiLogRenderer = ({ logString }: { logString: string }) => {
    const renderLine = (line: string, index: number) => {
        const parts = [];
        let lastIndex = 0;

        // Regex to find color patterns like [INFO], [ERROR], etc.
        const colorRegex = /(\[(?:INFO|SUCCESS|ADMIN|SERVER|WEB SERVER|CMD|EXEC|LOG|WARN|ERROR)\]|ws3-fca \[LOG\]|—BOT START—|-LOADING EVENTS-)/g;
        
        let match;
        while ((match = colorRegex.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{line.substring(lastIndex, match.index)}</span>);
            }

            const tag = match[0];
            let colorClass = '';

            if (tag.includes('[INFO]') || tag.includes('ws3-fca [LOG]')) colorClass = 'text-cyan-400';
            else if (tag.includes('[SUCCESS]')) colorClass = 'text-green-400';
            else if (tag.includes('[CMD]') || tag.includes('[EXEC]')) colorClass = 'text-blue-400';
            else if (tag.includes('[ADMIN') || tag.includes('[SERVER]')) colorClass = 'text-purple-400';
            else if (tag.includes('[WARN]')) colorClass = 'text-yellow-400';
            else if (tag.includes('[ERROR]')) colorClass = 'text-red-500';
            else if (tag.includes('—BOT START—') || tag.includes('-LOADING EVENTS-')) colorClass = 'text-yellow-300 font-bold';
            
            parts.push(<span key={`match-${lastIndex}`} className={colorClass}>{tag}</span>);
            lastIndex = match.index + tag.length;
        }

        // Add remaining text after the last match
        if (lastIndex < line.length) {
            parts.push(<span key={`text-${lastIndex}`}>{line.substring(lastIndex)}</span>);
        }

        return <div key={index}>{parts}</div>;
    };

    return (
        <pre className="p-2 md:p-4 text-sm font-mono whitespace-pre-wrap break-words">
            <code>{logString.split('\n').map(renderLine)}</code>
        </pre>
    );
};

function BotDetailClient() {
    const params = useParams();
    const botName = params.botName as string;
    const [logs, setLogs] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null);
    const { toast } = useToast();
    const [inputCommand, setInputCommand] = useState('');
    const [isMounted, setIsMounted] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const router = useRouter();

    // Install Dialog State
    const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
    const [moduleName, setModuleName] = useState('');
    const [isInstalling, setIsInstalling] = useState(false);

    const { data: statusData, mutate: mutateStatus } = useSWR(userId ? `/api/scripts?userId=${userId}` : null, (url) => fetcher(url).then(data => {
        return data.scripts.find((s: any) => s.name === botName);
    }), { refreshInterval: 2000 });

    const [uptime, setUptime] = useState('00:00:00');
    
    useEffect(() => {
        setIsMounted(true);
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        }
    }, []);

    useEffect(() => {
        const settingsRef = ref(db, 'admin/serverSettings/activeApiUrl');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            const url = snapshot.val();
            setActiveApiUrl(url || "https://cfgnnn-production.up.railway.app");
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (statusData?.status === 'running' && isMounted) {
            const interval = setInterval(() => {
                setUptime(formatUptime(statusData.startTime));
            }, 1000);
            return () => clearInterval(interval);
        } else if (isMounted) {
            setUptime(formatUptime(undefined));
        }
    }, [statusData, isMounted]);
    
    useEffect(() => {
        if (!activeApiUrl || !isMounted || !userId || !botName) return;

        fetch(`/api/logs/${botName}?userId=${userId}`)
            .then(res => res.json())
            .then(data => setLogs(data.logs || 'ยังไม่มี Log สำหรับโปรเจกต์นี้\n'));

        try {
            const serverUrl = new URL(activeApiUrl);
            const wsProtocol = serverUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${serverUrl.host}`;
            
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => ws.current?.send(JSON.stringify({ type: 'connect', botName, userId }));
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
    }, [botName, activeApiUrl, isMounted, userId]);

    useEffect(() => {
        if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }, [logs]);

    const handleAction = async (action: 'run' | 'stop') => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script: botName, userId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
        } catch (err: any) {
            toast({ title: 'เกิดข้อผิดพลาด', description: err.message, variant: 'destructive' });
        } finally {
            setTimeout(() => {
                mutateStatus();
            }, 1500);
        }
    };

    const handleSendCommand = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && inputCommand) {
            ws.current.send(JSON.stringify({ type: 'input', data: inputCommand }));
            setInputCommand('');
        }
    };
    
    const confirmInstall = async () => {
        if (!botName || !moduleName || !userId) return;
        setIsInstalling(true);
        try {
             const res = await fetch(`/api/install`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName, module: moduleName, userId }),
            });
             const data = await res.json();
             if (!res.ok) throw new Error(data.message);
             toast({ title: "ส่งคำสั่งแล้ว", description: data.message });
             setLogs(prev => prev + `\n[System] กำลังติดตั้ง ${moduleName}...\n`);
        } catch (err: any) {
             toast({ title: "เกิดข้อผิดพลาด", description: err.message, variant: 'destructive' });
        } finally {
            setIsInstalling(false);
            setIsInstallDialogOpen(false);
            setModuleName('');
        }
    };
    
    if (!isMounted) {
        return <div className="flex flex-col h-full bg-black text-white" />;
    }
    
    const isRunning = statusData?.status === 'running';

    return (
        <div className="flex flex-col h-full bg-black text-white">
             <header className="flex items-center p-2 md:p-4 border-b border-gray-800">
                <Link href="/dashboard/bots" passHref>
                    <Button variant="ghost" size="icon" className="mr-2 md:mr-4">
                        <ArrowLeft />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg md:text-xl font-semibold truncate">เทอร์มินัล: {botName}</h1>
                </div>
                <div className="ml-auto flex items-center gap-2 md:gap-4">
                    {statusData && (
                        <>
                            <p className={cn("hidden sm:block text-sm", isRunning ? 'text-green-400' : 'text-red-500')}>
                                {statusData?.status || 'Offline'}
                            </p>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 md:h-9 md:w-9"
                                onClick={() => setIsInstallDialogOpen(true)}
                            >
                                <Package className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 md:h-9 md:w-9"
                                onClick={() => router.push(`/dashboard/bots/${botName}/settings`)}
                            >
                                <Settings className="h-4 w-4 md:h-5 md:w-5" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className={cn(
                                    "h-8 w-8 md:h-9 md:w-9 rounded-full",
                                    isRunning ? "bg-red-500/80 hover:bg-red-600/80 text-white" : "bg-green-500/80 hover:bg-green-600/80 text-white"
                                )}
                                onClick={() => handleAction(isRunning ? 'stop' : 'run')}
                            >
                                {isRunning ? <StopCircle className="h-4 w-4 md:h-5 md:w-5" /> : <Play className="h-4 w-4 md:h-5 md:w-5" />}
                            </Button>
                        </>
                    )}
                </div>
            </header>
            
            <ScrollArea className="flex-grow" ref={logContainerRef}>
                <AnsiLogRenderer logString={logs} />
            </ScrollArea>

            <footer className="p-2 border-t border-gray-800 bg-[#1e1e1e]">
                 <div className="relative">
                    <Input
                        type="text"
                        placeholder="พิมพ์คำสั่ง ..."
                        value={inputCommand}
                        onChange={(e) => setInputCommand(e.target.value)}
                        className="w-full pl-4 pr-12 py-2 rounded-lg border-none bg-[#2a2a2a] h-11 text-base focus-visible:ring-1 focus-visible:ring-primary"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendCommand();
                        }}
                    />
                     <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 bg-primary hover:bg-primary/90 rounded-md" onClick={handleSendCommand}>
                        <Send className="h-5 w-5"/>
                    </Button>
                </div>
            </footer>
             
             {/* Install Dialog */}
            <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>ติดตั้ง Dependencies</DialogTitle>
                        <DialogDescription>
                            กรอกชื่อโมดูลที่ต้องการติดตั้ง (เช่น express, discord.js) คำสั่งจะถูกส่งไปยังเทอร์มินัล
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
                           placeholder="e.g., discord.js"
                         />
                       </div>
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => { setIsInstallDialogOpen(false); setModuleName(''); }}>ยกเลิก</Button>
                         <Button onClick={confirmInstall} disabled={isInstalling || !moduleName}>
                            {isInstalling ? 'กำลังติดตั้ง...' : 'ติดตั้ง'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function BotDetailPage() {
    return <BotDetailClient />;
}
