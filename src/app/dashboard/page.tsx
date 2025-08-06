
"use client"

import useSWR from 'swr'
import Link from "next/link"
import { CheckCircle, XCircle } from "lucide-react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function DashboardPage() {
    const { data, error } = useSWR('/api/scripts', fetcher, { refreshInterval: 5000 });

  return (
    <>
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
    </>
  )
}
