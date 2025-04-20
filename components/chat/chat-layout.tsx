"use client"
import { Sidebar } from "@/components/chat/sidebar"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ChatLayoutProps {
  user: any
  conversations: any[]
}

export function ChatLayout({ user, conversations }: ChatLayoutProps) {
  const router = useRouter()

  return (
    <div className="flex h-screen bg-background">
      <div className="w-full md:w-80 h-full">
        <Sidebar user={user} conversations={conversations} />
      </div>
      <div className="hidden md:flex flex-col flex-1 items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#FD79A8] to-[#6C5CE7] text-transparent bg-clip-text">
            Shadow App
          </h1>
          <p className="text-muted-foreground mb-6">Select a chat or start a new conversation</p>
          <Button onClick={() => router.push("/chat/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Conversation
          </Button>
        </div>
      </div>
    </div>
  )
}
