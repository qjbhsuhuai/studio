"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Cpu, Database, MemoryStick, Timer } from "lucide-react"

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

const chartData = [
  { month: "มกราคม", cpu: 186, memory: 80 },
  { month: "กุมภาพันธ์", cpu: 305, memory: 200 },
  { month: "มีนาคม", cpu: 237, memory: 120 },
  { month: "เมษายน", cpu: 73, memory: 190 },
  { month: "พฤษภาคม", cpu: 209, memory: 130 },
  { month: "มิถุนายน", cpu: 214, memory: 140 },
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

const bots = [
  { name: "AdminBot", type: "Discord", status: "ออนไลน์" },
  { name: "WelcomeBot", type: "Discord", status: "ออนไลน์" },
  { name: "MarketWatch", type: "Telegram", status: "ออฟไลน์" },
  { name: "SupportAgent", type: "Custom", status: "ออนไลน์" },
  { name: "GiveawayMaster", type: "Discord", status: "ผิดพลาด" },
]

export default function DashboardPage() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การใช้งาน CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              ความเสี่ยงดาวน์ไทม์: 0.02%
            </p>
            <Progress value={72} className="mt-4 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การใช้งานหน่วยความจำ</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.4 / 16 GB</div>
            <p className="text-xs text-muted-foreground">
              ประสิทธิภาพคงที่
            </p>
            <Progress value={(5.4 / 16) * 100} className="mt-4 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พื้นที่จัดเก็บ</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89 / 200 GB</div>
            <p className="text-xs text-muted-foreground">
              ความเสี่ยงดาวน์ไทม์ต่ำ
            </p>
            <Progress value={(89 / 200) * 100} className="mt-4 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เวลาทำงาน</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.98%</div>
            <p className="text-xs text-muted-foreground">
              42 วันโดยไม่มีเหตุการณ์
            </p>
            <Progress value={99.98} className="mt-4 h-2" />
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
                {bots.map((bot) => (
                  <TableRow key={bot.name}>
                    <TableCell className="font-medium">{bot.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{bot.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bot.status === "ออนไลน์"
                            ? "default"
                            : bot.status === "ออฟไลน์"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {bot.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">จัดการ</Button>
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
