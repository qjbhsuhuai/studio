import { type ReactNode } from "react"
import Link from "next/link"
import { Bell, Bot, Home, LifeBuoy, Search, Server, Settings2, BarChart2, Users } from "lucide-react"

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BotIcon } from "@/components/icons"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const navItems = [
    { href: "/dashboard", icon: <Home />, label: "แดชบอร์ด" },
    { href: "/dashboard/bots", icon: <Bot />, label: "บอท" },
    { href: "/dashboard/users", icon: <Users />, label: "ผู้ใช้" },
    { href: "#", icon: <Server />, label: "เซิร์ฟเวอร์" },
    { href: "#", icon: <BarChart2 />, label: "การใช้งาน" },
  ]

  const secondaryNavItems = [
    { href: "#", icon: <Settings2 />, label: "ตั้งค่า" },
    { href: "#", icon: <LifeBuoy />, label: "ช่วยเหลือ" },
  ]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2">
            <BotIcon className="h-7 w-7 text-primary" />
            <span className="text-xl font-semibold">BotFarm</span>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <SidebarMenu className="p-2">
            {navItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-0">
          <SidebarSeparator />
          <SidebarMenu className="p-2">
            {secondaryNavItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    {item.icon}
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-4 sm:h-[60px] sm:px-6">
          <div className="w-full flex-1">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="ค้นหา..."
                  className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
                />
              </div>
            </form>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="sr-only">สลับการแจ้งเตือน</span>
          </Button>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col overflow-auto">
            <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
