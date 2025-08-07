
import { BotIcon } from "@/components/icons";

export default function Preloader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white animate-in fade-in duration-1000">
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-full blur-xl opacity-75 animate-pulse-glow"></div>
        <div className="relative h-28 w-28 p-6 bg-black rounded-full flex items-center justify-center z-10">
          <BotIcon className="h-20 w-20 text-primary drop-shadow-[0_0_10px_hsl(var(--primary))]" />
        </div>
      </div>
      <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-500">
        <h1 className="text-4xl font-bold tracking-wider">BotFarm</h1>
        <p className="text-lg text-muted-foreground mt-2">Initializing System...</p>
      </div>
    </div>
  );
}
