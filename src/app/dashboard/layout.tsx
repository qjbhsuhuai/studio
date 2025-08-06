
import { type ReactNode } from "react"
import Link from "next/link"
import { Settings, Globe } from "lucide-react"
import { BotIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div 
        className="flex min-h-screen w-full flex-col bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/city-bg.jpg')" }}
      >
        <div className="flex min-h-screen w-full flex-col bg-black/60 backdrop-blur-sm">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 px-4 md:px-6">
            <div className="flex items-center gap-2">
                <BotIcon className="h-7 w-7 text-primary" />
                <div>
                    <h1 className="text-lg font-bold">Bot Manager Pro</h1>
                    <p className="text-xs text-muted-foreground">จัดการสคริปต์และไฟล์ของคุณอย่างมืออาชีพ</p>
                </div>
            </div>
            <div className="flex w-full items-center gap-2 md:ml-auto justify-end">
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Globe className="h-5 w-5" />
                </Button>
            </div>
          </header>
          <main className="flex flex-1 flex-col overflow-auto">
            <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
