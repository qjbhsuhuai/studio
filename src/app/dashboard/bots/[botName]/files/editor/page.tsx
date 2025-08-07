
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

    useEffect(() => {
        if (!filePath || !botName) return;

        setIsLoading(true);
        fetch(`/api/files/${botName}/content?path=${encodeURIComponent(filePath)}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to fetch file content');
                }
                return res.json();
            })
            .then(data => {
                setContent(data.content);
            })
            .catch(error => {
                toast({
                    title: "Error loading file",
                    description: error.message,
                    variant: "destructive"
                });
                router.back();
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [filePath, botName, toast, router]);

    const handleSave = async () => {
        if (!filePath || !botName) return;

        setIsSaving(true);
        try {
            const res = await fetch(`/api/files/${botName}/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: filePath, content }),
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
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading editor...</div>}>
            <FileEditor />
        </Suspense>
    )
}
