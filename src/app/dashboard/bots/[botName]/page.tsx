// This is a placeholder file. The content will be implemented in the next steps.
"use client"
import { useEffect, useState, useRef } from 'react';
import useSWR from 'swr';
import { Play, StopCircle, Trash2, Upload, FilePlus, FolderPlus, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function BotDetailPage({ params }: { params: { botName: string } }) {
    const { botName } = params;
    const { data: filesData, error: filesError, mutate: mutateFiles } = useSWR(`/api/files/${botName}`, fetcher);
    const [logs, setLogs] = useState('');
    const ws = useRef<WebSocket | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null);

    useEffect(() => {
        const settingsRef = ref(db, 'admin/serverSettings/activeApiUrl');
        const unsubscribe = onValue(settingsRef, (snapshot) => {
            const url = snapshot.val();
            if (url) {
                setActiveApiUrl(url);
            } else {
                 // Fallback or default if not set
                setActiveApiUrl("https://cfgnnn-production.up.railway.app");
            }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (!activeApiUrl) return;

        // Fetch initial logs
        fetch(`/api/logs/${botName}`)
            .then(res => res.json())
            .then(data => setLogs(data.logs || 'ยังไม่มี Log สำหรับโปรเจกต์นี้\n'));

        try {
            const serverUrl = new URL(activeApiUrl);
            const wsProtocol = serverUrl.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${serverUrl.host}`;
            
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('WebSocket connected');
                ws.current?.send(JSON.stringify({ type: 'connect', botName }));
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.type === 'log') {
                        setLogs(prevLogs => prevLogs + message.data);
                    } else if (message.type === 'exit') {
                        setLogs(prevLogs => prevLogs + `\n[System] โปรเจกต์หยุดทำงานด้วย exit code ${message.code}.\n`);
                    }
                } catch (e) {
                     setLogs(prevLogs => prevLogs + event.data);
                }
            };

            ws.current.onclose = () => {
                console.log('WebSocket disconnected');
                 setLogs(prevLogs => prevLogs + '\n[System] การเชื่อมต่อกับเซิร์ฟเวอร์ถูกตัด\n');
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setLogs(prevLogs => prevLogs + '\n[System] เกิดข้อผิดพลาดในการเชื่อมต่อ WebSocket\n');
            };
        } catch (error) {
            console.error("Failed to construct WebSocket URL:", error);
            setLogs(prevLogs => prevLogs + '\n[System] URL ของ API ไม่ถูกต้อง ไม่สามารถสร้างการเชื่อมต่อ WebSocket ได้\n');
        }


        return () => {
            ws.current?.close();
        };
    }, [botName, activeApiUrl]);

    useEffect(() => {
        // Auto-scroll logs
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Console Log: {botName}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline"><Play className="mr-2 h-4 w-4" /> เริ่ม</Button>
                                <Button size="sm" variant="destructive"><StopCircle className="mr-2 h-4 w-4" /> หยุด</Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px] w-full rounded-md border bg-black text-white font-mono text-sm p-4" ref={logContainerRef}>
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
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>File Manager</span>
                            <div className="flex gap-2">
                                 <Button size="icon" variant="outline" className="h-8 w-8"><FolderPlus className="h-4 w-4" /></Button>
                                 <Button size="icon" variant="outline" className="h-8 w-8"><FilePlus className="h-4 w-4" /></Button>
                                 <Button size="icon" variant="outline" className="h-8 w-8"><Upload className="h-4 w-4" /></Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[600px] w-full rounded-md border p-2">
                            {filesError && <div className="text-destructive">ไม่สามารถโหลดไฟล์ได้</div>}
                            {!filesData && !filesError && <div>กำลังโหลด...</div>}
                            <ul>
                                {filesData?.files.map((file: any) => (
                                    <li key={file.name} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                                       <span>{file.name}</span>
                                       <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
