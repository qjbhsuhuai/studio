
"use client"

import useSWR from 'swr'
import Link from "next/link"
import { CpuIcon, MemoryStickIcon, GaugeIcon, BotIcon } from "@/components/icons"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button'


const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
    const { data: scriptsData } = useSWR('/api/scripts', fetcher, { refreshInterval: 5000 });
    const { data: envData } = useSWR('/api/environment', fetcher);

    const totalBots = scriptsData?.scripts?.length || 0;
    const runningBots = scriptsData?.scripts?.filter((bot: any) => bot.status === 'running').length || 0;

    const aggregateStats = (scripts: any[]) => {
        if (!scripts || scripts.length === 0) {
            return { totalCpu: 0, totalMemory: 0 };
        }
        return scripts.reduce(
            (acc, bot) => {
                if (bot.status === 'running') {
                    acc.totalCpu += parseFloat(bot.cpu) || 0;
                    acc.totalMemory += parseFloat(bot.memory) || 0;
                }
                return acc;
            },
            { totalCpu: 0, totalMemory: 0 }
        );
    };

    const { totalCpu, totalMemory } = aggregateStats(scriptsData?.scripts);


  return (
    <>
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">บอททั้งหมด</CardTitle>
                    <BotIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalBots}</div>
                    <p className="text-xs text-muted-foreground">{runningBots} ตัวกำลังทำงาน</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">การใช้ CPU ทั้งหมด</CardTitle>
                    <CpuIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCpu.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">จากทุกโปรเจกต์ที่ทำงานอยู่</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">การใช้ Memory ทั้งหมด</CardTitle>
                    <MemoryStickIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalMemory.toFixed(1)} MB</div>
                     <p className="text-xs text-muted-foreground">จากทุกโปรเจกต์ที่ทำงานอยู่</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">สถานะเซิร์ฟเวอร์</CardTitle>
                    <GaugeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-400">ออนไลน์</div>
                    <p className="text-xs text-muted-foreground">ทำงานบน: {envData?.detail || 'กำลังโหลด...'}</p>
                </CardContent>
            </Card>
        </div>
        <div className="flex items-center justify-center">
             <Button asChild className="mt-8">
                <Link href="/dashboard/bots">ไปที่หน้าจัดการโปรเจกต์</Link>
            </Button>
        </div>
    </>
  )
}
