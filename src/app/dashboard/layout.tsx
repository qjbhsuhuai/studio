
"use client"

import { type ReactNode, Suspense } from "react"
import Link from "next/link"
import { Settings, Globe, Bot, Users, LayoutDashboard, LogOut, Coins } from "lucide-react"
import { BotIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { cn } from "@/lib/utils"
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// A helper component to conditionally render layout
function ConditionalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Check if the current path is for a specific bot detail page, file manager, editor, or settings
  const isSpecialPage = /^\/dashboard\/bots\/[^/]+(\/(files(\/editor)?|settings))?$/.test(pathname || '');

  if (isSpecialPage) {
    return (
        <main className="flex-1 h-screen overflow-hidden bg-black">
             <Suspense fallback={<div className="h-full w-full flex items-center justify-center bg-black text-white">Loading Page...</div>}>
                {children}
            </Suspense>
        </main>
    );
  }

  return (
    <div 
      className="flex min-h-screen w-full flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/city-bg.jpg')" }}
    >
      <div className="flex min-h-screen w-full flex-col bg-black/60 backdrop-blur-sm">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/50 px-4 md:px-6 backdrop-blur-lg">
          <div className="flex items-center gap-2">
              <BotIcon className="h-7 w-7 text-primary" />
              <div>
                  <h1 className="text-lg font-bold">BotFarm</h1>
              </div>
          </div>
          <div className="flex w-full items-center gap-2 md:ml-auto justify-end">
              <UserNav />
          </div>
        </header>

        <div className="flex flex-1">
            <aside className="hidden w-16 flex-col border-r bg-background/50 sm:flex">
                 <TooltipProvider>
                    <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                        <Link
                        href="/dashboard"
                        className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                        >
                        <BotIcon className="h-4 w-4 transition-all group-hover:scale-110" />
                        <span className="sr-only">BotFarm</span>
                        </Link>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                href="/dashboard"
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                    pathname === '/dashboard' && "bg-accent text-accent-foreground"
                                )}
                                >
                                <LayoutDashboard className="h-5 w-5" />
                                <span className="sr-only">Dashboard</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Dashboard</TooltipContent>
                        </Tooltip>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                href="/dashboard/bots"
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                                    (pathname === '/dashboard/bots' || pathname?.startsWith('/dashboard/bots/')) && "bg-accent text-accent-foreground"
                                )}
                                >
                                <Bot className="h-5 w-5" />
                                <span className="sr-only">Projects</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Projects</TooltipContent>
                        </Tooltip>
                    </nav>
                </TooltipProvider>
            </aside>
            <main className="flex flex-1 flex-col overflow-auto">
              <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                {children}
              </div>
            </main>
        </div>
      </div>
    </div>
  );
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ConditionalLayout>
      {children}
    </ConditionalLayout>
  )
}
