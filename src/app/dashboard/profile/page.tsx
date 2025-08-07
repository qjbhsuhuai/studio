
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { get, ref, onValue, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        const userEmail = sessionStorage.getItem('userEmail');
        if (userEmail) {
            const id = userEmail.replace(/[.#$[\]]/g, "_");
            setUserId(id);
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        if (!userId) return;

        const userRef = ref(db, `users/${userId}`);
        const listener = onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setProfile({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    avatar: data.avatar || '',
                });
                if (data.avatar) {
                    setImagePreview(data.avatar);
                }
            }
            setIsLoading(false);
        });

        return () => off(userRef, 'value', listener);
    }, [userId]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        if (!userId || !profile) return;

        setIsSaving(true);
        try {
            // Note: In a real app, you would upload the selectedFile to a storage service 
            // (like Firebase Storage) and get a URL back.
            // For this prototype, we'll just save the profile data.
            // If there was an image preview from a file, it means a new image was selected.
            // A real implementation would handle the upload and get a new URL.
            // We will just simulate this by showing a success message.
            
            const updates: Partial<UserProfile> = {
                firstName: profile.firstName,
                lastName: profile.lastName,
            };

            if (selectedFile) {
                // Here you would call your upload service
                // const newAvatarUrl = await uploadImage(selectedFile);
                // updates.avatar = newAvatarUrl;
                toast({ title: 'จำลองการอัปโหลด', description: 'ในแอปจริง รูปภาพของคุณจะถูกอัปโหลดที่นี่' });
            }

            const userRef = ref(db, `users/${userId}`);
            await update(userRef, updates);

            toast({
                title: "บันทึกสำเร็จ",
                description: "ข้อมูลโปรไฟล์ของคุณถูกอัปเดตแล้ว",
            });

        } catch (error) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
            setSelectedFile(null); // Reset file selection
        }
    };
    
    if (isLoading || !profile) {
        return (
             <div className="flex justify-center items-start py-6 md:py-12 px-4">
                 <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg border-border">
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                         <div className="flex items-center gap-6">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-36" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                     <CardFooter>
                        <Skeleton className="h-10 w-32" />
                    </CardFooter>
                 </Card>
            </div>
        )
    }

  return (
    <div className="flex justify-center items-start py-6 md:py-12 px-4">
      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg border-border">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">โปรไฟล์ของฉัน</CardTitle>
          <CardDescription>
            จัดการข้อมูลส่วนตัวและตั้งค่าบัญชีของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-primary/50">
                  <AvatarImage src={imagePreview || ''} alt="User Avatar" data-ai-hint="person avatar" />
                  <AvatarFallback className="text-3xl">{profile.firstName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-background/80 group-hover:bg-primary group-hover:text-primary-foreground"
                    onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-4 w-4" />
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                />
            </div>
            <div className="text-center sm:text-left">
                <h2 className="text-2xl font-semibold">{profile.firstName} {profile.lastName}</h2>
                <p className="text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    id="firstName" 
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    placeholder="ชื่อจริง"
                    className="pl-10 h-12 text-base"
                />
            </div>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    id="lastName" 
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    placeholder="นามสกุล" 
                    className="pl-10 h-12 text-base"
                />
            </div>
            <div className="relative">
                 <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="email" type="email" value={profile.email} disabled className="pl-10 h-12 text-base" />
            </div>
            <div className="relative">
                 <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="new-password" type="password" placeholder="ตั้งรหัสผ่านใหม่" className="pl-10 h-12 text-base" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
