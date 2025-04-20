"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import type { Database } from "@/lib/database.types"

type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  sender: {
    id: string
    username: string
    avatar_url: string | null
  }
}

interface ChatMessagesProps {
  conversationId: string
}

export function ChatMessages({ conversationId }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setCurrentUserId(user.id)
      }

      const { data } = await supabase
        .from("messages")
        .select(`
          *,
          sender:sender_id(
            id,
            username,
            avatar_url
          )
        `)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (data) {
        setMessages(data as Message[])

        // Mark messages as read
        const unreadMessages = data.filter((message) => !message.read && message.sender_id !== user?.id)

        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map((message) => supabase.from("messages").update({ read: true }).eq("id", message.id)),
          )
        }
      }

      setLoading(false)
    }

    fetchMessages()

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from("messages")
            .select(`
            *,
            sender:sender_id(
              id,
              username,
              avatar_url
            )
          `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data as Message])

            // Mark message as read if it's not from the current user
            const {
              data: { user },
            } = await supabase.auth.getUser()

            if (data.sender_id !== user?.id) {
              await supabase.from("messages").update({ read: true }).eq("id", data.id)
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-foreground-muted">Loading messages...</p>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-foreground-muted">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
      {messages.map((message, index) => {
        const isCurrentUser = message.sender.id === currentUserId
        const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id

        return (
          <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
            {!isCurrentUser && showAvatar && (
              <Avatar className="mr-2 mt-1">
                <AvatarImage src={message.sender.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {message.sender.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div className={`max-w-[70%] ${!isCurrentUser && !showAvatar ? "ml-10" : ""}`}>
              {showAvatar && !isCurrentUser && (
                <p className="text-xs text-foreground-muted mb-1">{message.sender.username}</p>
              )}

              <div
                className={`
                rounded-lg px-3 py-2 
                ${
                  isCurrentUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-card text-foreground rounded-bl-none"
                }
              `}
              >
                <p className="text-sm">{message.content}</p>
              </div>

              <p className="text-xs text-foreground-muted mt-1">{format(new Date(message.created_at), "p")}</p>
            </div>
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
