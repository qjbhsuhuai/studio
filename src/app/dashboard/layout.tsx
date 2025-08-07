
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
