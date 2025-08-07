
"use client"

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

function FileEditor() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const botName = params.botName as string;
    const filePath = searchParams.get('filePath');

    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

     useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        }
    }, []);

    useEffect(() => {
        if (!filePath || !botName || !userId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        fetch(`/api/file/content?botName=${encodeURIComponent(botName)}&fileName=${encodeURIComponent(filePath)}&userId=${userId}`)
            .then(res => {
                if (!res.ok) {
                     return res.json().then(err => { throw new Error(err.message || 'Failed to fetch file content') });
                }
                return res.json();
            })
            .then(data => {
                setContent(data.content);
            })
            .catch(error => {
                console.error("Error loading file:", error);
                toast({
                    title: "Error loading file",
                    description: error.message,
                    variant: "destructive"
                });
                // Optional: go back if file fails to load
                // router.back(); 
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [filePath, botName, userId, toast, router]);

    const handleSave = async () => {
        if (!filePath || !botName || !userId) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/file/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botName: botName, fileName: filePath, content, userId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to save file');
            }
            
            const result = await res.json();
            toast({
                title: "File Saved",
                description: result.message,
            });
        } catch (error: any) {
            toast({
                title: "Error saving file",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };
    
    const fileName = filePath?.split('/').pop();

    return (
        <div className="flex flex-col h-full text-white bg-black">
            <header className="flex items-center p-4 border-b border-gray-800">
                <Button variant="ghost" size="icon" className="mr-4" onClick={handleGoBack}>
                    <ArrowLeft />
                </Button>
                <h1 className="text-xl font-semibold">Editing: {fileName || 'File'}</h1>
                <div className="ml-auto">
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                </div>
            </header>
            
            <main className="flex-1 p-4 overflow-auto">
                {isLoading ? (
                    <Skeleton className="w-full h-full bg-muted/20" />
                ) : (
                    <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full p-4 font-mono text-base bg-[#1e1e1e] border-gray-700 rounded-lg resize-none focus:ring-primary focus:border-primary"
                        placeholder="File content goes here..."
                    />
                )}
            </main>
        </div>
    );
}

export default function FileEditorPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full bg-black text-white">Loading editor...</div>}>
            <FileEditor />
        </Suspense>
    )
}
