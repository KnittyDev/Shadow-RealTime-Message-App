"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"
import type { Database } from "@/lib/database.types"

type ConversationWithParticipants = Database["public"]["Tables"]["conversations"]["Row"] & {
  participants: {
    users: {
      id: string
      username: string
      avatar_url: string | null
    }
  }[]
}

interface ChatHeaderProps {
  conversation: ConversationWithParticipants
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const router = useRouter()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const getConversationName = () => {
    if (conversation.is_group) return conversation.name

    // For direct messages, show the other participant's name
    return conversation.participants.map((p) => p.users.username).join(", ")
  }

  const getAvatarInfo = () => {
    if (conversation.is_group) {
      return {
        src: null,
        fallback: conversation.name?.substring(0, 2).toUpperCase() || "GC",
      }
    }

    // For direct messages, show the other participant's avatar
    const otherParticipant = conversation.participants[0]?.users

    return {
      src: otherParticipant?.avatar_url || undefined,
      fallback: otherParticipant?.username.substring(0, 2).toUpperCase() || "??",
    }
  }

  const avatarInfo = getAvatarInfo()

  return (
    <div className="flex items-center p-4 border-b border-border bg-card">
      {isMobile && (
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <Avatar>
        <AvatarImage src={avatarInfo.src || undefined} />
        <AvatarFallback className="bg-primary text-primary-foreground">{avatarInfo.fallback}</AvatarFallback>
      </Avatar>

      <div className="ml-3 flex-1">
        <h2 className="text-base font-semibold text-foreground">{getConversationName()}</h2>
        <p className="text-xs text-foreground-muted">
          {conversation.is_group ? `${conversation.participants.length} participants` : "Online"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
