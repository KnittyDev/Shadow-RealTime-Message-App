"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/database.types"
import { format } from "date-fns"

type Conversation = Database["public"]["Tables"]["conversations"]["Row"] & {
  participants: {
    users: {
      id: string
      username: string
      avatar_url: string | null
    }
  }[]
  last_message?: {
    content: string
    created_at: string
  }
}

interface ConversationListProps {
  searchTerm?: string
}

export function ConversationList({ searchTerm = "" }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get all conversations where the current user is a participant
      const { data: participantData } = await supabase
        .from("participants")
        .select("conversation_id")
        .eq("user_id", user.id)

      if (!participantData || participantData.length === 0) {
        setLoading(false)
        return
      }

      const conversationIds = participantData.map((p) => p.conversation_id)

      // Get conversations with participants
      const { data: conversationsData } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:participants(
            users:user_id(
              id,
              username,
              avatar_url
            )
          )
        `)
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false })

      if (!conversationsData) {
        setLoading(false)
        return
      }

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversationsData.map(async (conversation) => {
          const { data: messagesData } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", conversation.id)
            .order("created_at", { ascending: false })
            .limit(1)

          return {
            ...conversation,
            last_message: messagesData && messagesData.length > 0 ? messagesData[0] : undefined,
          }
        }),
      )

      setConversations(conversationsWithLastMessage)
      setLoading(false)
    }

    fetchConversations()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel("conversation_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const filteredConversations = conversations.filter((conversation) => {
    if (!searchTerm) return true

    // Search by conversation name if it's a group
    if (conversation.is_group && conversation.name) {
      return conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
    }

    // Search by participant names for direct messages
    return conversation.participants.some((p) => p.users.username.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  const getConversationName = (conversation: Conversation) => {
    if (conversation.is_group) return conversation.name

    // For direct messages, show the other participant's name
    return conversation.participants.map((p) => p.users.username).join(", ")
  }

  const getAvatarInfo = (conversation: Conversation) => {
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

  if (loading) {
    return <div className="p-4 text-center text-foreground-muted">Loading conversations...</div>
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="p-4 text-center text-foreground-muted">
        {searchTerm ? "No conversations found" : "No conversations yet"}
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {filteredConversations.map((conversation) => {
        const isActive = pathname === `/conversations/${conversation.id}`
        const avatarInfo = getAvatarInfo(conversation)

        return (
          <div
            key={conversation.id}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition",
              isActive && "bg-muted",
            )}
            onClick={() => router.push(`/conversations/${conversation.id}`)}
          >
            <Avatar>
              <AvatarImage src={avatarInfo.src || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground">{avatarInfo.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium text-foreground truncate">{getConversationName(conversation)}</p>
                {conversation.last_message && (
                  <span className="text-xs text-foreground-muted">
                    {format(new Date(conversation.last_message.created_at), "p")}
                  </span>
                )}
              </div>
              {conversation.last_message && (
                <p className="text-xs text-foreground-muted truncate">{conversation.last_message.content}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
