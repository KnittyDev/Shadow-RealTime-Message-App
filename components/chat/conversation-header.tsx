"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ConversationHeaderProps {
  conversation: any
  currentUserId: string
}

export function ConversationHeader({ conversation, currentUserId }: ConversationHeaderProps) {
  const router = useRouter()

  const getConversationName = () => {
    if (conversation.is_group) return conversation.name

    const otherParticipants = conversation.participants.filter((p: any) => p.user_id !== currentUserId)
    return otherParticipants.map((p: any) => p.users.username).join(", ")
  }

  const getAvatarInfo = () => {
    if (conversation.is_group) {
      return {
        src: null,
        fallback: conversation.name?.substring(0, 2).toUpperCase() || "GC",
      }
    }

    const otherParticipant = conversation.participants.find((p: any) => p.user_id !== currentUserId)?.users

    return {
      src: otherParticipant?.avatar_url,
      fallback: otherParticipant?.username.substring(0, 2).toUpperCase() || "??",
    }
  }

  const avatarInfo = getAvatarInfo()

  return (
    <div className="p-4 border-b border-border flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Avatar>
        <AvatarImage src={avatarInfo.src || undefined} />
        <AvatarFallback>{avatarInfo.fallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="font-medium">{getConversationName()}</h2>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Profile</DropdownMenuItem>
          <DropdownMenuItem>Delete Conversation</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
