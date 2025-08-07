
"use client"
import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Play, StopCircle, HardDrive, Cpu, Gauge, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { cn } from '@/lib/utils';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function formatUptime(startTime: number | undefined): string {
    if (!startTime) return '00:00:00';
    const now = Date.now();
    let totalSeconds = Math.floor((now - startTime) / 1000);
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
        <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-words">
            <code>{logString.split('\n').map(renderLine)}</code>
        </pre>
    );
};

function BotDetailClient({ params }: { params: { botName: string } }) {
    const { botName } = params;
    const [logs, setLogs] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null);
    const { toast } = useToast();
    const [inputCommand, setInputCommand] = useState('');

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

    const handleSendCommand = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && inputCommand) {
            ws.current.send(JSON.stringify({ type: 'input', data: inputCommand }));
            setInputCommand('');
        }
    };
    
    const isRunning = statusData?.status === 'running';

    return (
        <div className="flex flex-col h-full bg-black text-white">
             <header className="flex items-center p-4 border-b border-gray-800">
                <Link href="/dashboard/bots" passHref>
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft />
                    </Button>
                </Link>
                <h1 className="text-xl font-semibold">เทอร์มินัล: {botName}</h1>
                <div className="ml-auto flex items-center gap-4">
                     <p className={cn("text-sm", isRunning ? 'text-green-400' : 'text-red-500')}>
                        {statusData?.status || 'Offline'}
                     </p>
                     <Button 
                        size="icon" 
                        variant="ghost" 
                        className={cn(
                            "h-9 w-9 rounded-full",
                            isRunning ? "bg-red-500/80 hover:bg-red-600/80 text-white" : "bg-green-500/80 hover:bg-green-600/80 text-white"
                        )}
                        onClick={() => handleAction(isRunning ? 'stop' : 'run')}
                    >
                        {isRunning ? <StopCircle className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
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
        </div>
    );
}

export default function BotDetailPage({ params }: { params: { botName: string } }) {
    return <BotDetailClient params={params} />;
}
