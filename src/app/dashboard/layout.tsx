import { type ReactNode } from "react"
import Link from "next/link"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BotIcon } from "@/components/icons"
import { UserNav } from "@/components/user-nav"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <BotIcon className="h-7 w-7 text-primary" />
          <span className="text-xl font-semibold">BotFarm</span>
        </Link>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial" />
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
            <span className="sr-only">สลับการแจ้งเตือน</span>
          </Button>
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col overflow-auto">
        <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
