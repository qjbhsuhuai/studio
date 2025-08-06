"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Cpu, Database, MemoryStick, Timer, Bot, CheckCircle, XCircle, Clock, Server } from "lucide-react"
import useSWR from 'swr'
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const chartData = [
  { month: "มกราคม", cpu: 0, memory: 0 },
  { month: "กุมภาพันธ์", cpu: 0, memory: 0 },
  { month: "มีนาคม", cpu: 0, memory: 0 },
  { month: "เมษายน", cpu: 0, memory: 0 },
  { month: "พฤษภาคม", cpu: 0, memory: 0 },
  { month: "มิถุนายน", cpu: 0, memory: 0 },
]

const chartConfig = {
  cpu: {
    label: "CPU (%)",
    color: "hsl(var(--primary))",
  },
  memory: {
    label: "หน่วยความจำ (GB)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export default function DashboardPage() {
    const { data, error } = useSWR('/api/scripts', fetcher, { refreshInterval: 5000 });

    const totalBots = data?.scripts?.length || 0;
    const runningBots = data?.scripts?.filter((bot: any) => bot.status === 'running').length || 0;

    const totalCpuUsage = data?.scripts?.reduce((acc: number, bot: any) => acc + (parseFloat(bot.cpu) || 0), 0) || 0;
    const totalMemoryUsage = data?.scripts?.reduce((acc: number, bot: any) => acc + (parseFloat(bot.memory) || 0), 0) || 0;


  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">บอททั้งหมด</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBots}</div>
            <p className="text-xs text-muted-foreground">
              {runningBots} ตัวกำลังทำงาน
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การใช้งาน CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCpuUsage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              ความเสี่ยงดาวน์ไทม์: 0%
            </p>
            <Progress value={totalCpuUsage} className="mt-4 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การใช้งานหน่วยความจำ</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMemoryUsage.toFixed(1)} MB</div>
            <p className="text-xs text-muted-foreground">
              ไม่มีข้อมูล
            </p>
            <Progress value={0} className="mt-4 h-2" />
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สถานะเซิร์ฟเวอร์</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="flex items-center gap-2 text-2xl font-bold">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span>ออนไลน์</span>
            </div>
            <p className="text-xs text-muted-foreground">
              ทำงานปกติ
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>แผงควบคุมโฮสติ้งบอท</CardTitle>
            <CardDescription>
              จัดการบอท Discord, Telegram และบอทอื่นๆ ของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">การกระทำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-destructive">
                            ไม่สามารถโหลดข้อมูลบอทได้
                        </TableCell>
                    </TableRow>
                )}
                {!data && !error && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">
                            กำลังโหลด...
                        </TableCell>
                    </TableRow>
                )}
                {data?.scripts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      ไม่มีบอท
                    </TableCell>
                  </TableRow>
                )}
                {data?.scripts.map((bot: any) => (
                  <TableRow key={bot.name}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bot.type}</Badge>
                    </TableCell>
                    <TableCell>
                       <Badge
                        variant={
                          bot.status === "running"
                            ? "default"
                            : "secondary"
                        }
                        className={bot.status === 'running' ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                         {bot.status === "running" ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                         ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                         )}
                        {bot.status === "running" ? "ออนไลน์" : "ออฟไลน์"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/bots/${bot.name}`}>จัดการ</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>ประวัติการใช้ทรัพยากร</CardTitle>
            <CardDescription>
              ประมาณการใช้งานในช่วง 6 เดือนที่ผ่านมา
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="cpu" fill="var(--color-cpu)" radius={4} />
                <Bar dataKey="memory" fill="var(--color-memory)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
