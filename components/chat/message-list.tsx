"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender: {
    username: string
    avatar_url: string | null
  }
}

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
      {messages.map((message) => {
        const isCurrentUser = message.sender_id === currentUserId

        return (
          <div key={message.id} className={`flex gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
            {!isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender.avatar_url || undefined} />
                <AvatarFallback>{message.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
            <div className={`max-w-[70%] flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
              <div
                className={`px-4 py-2 rounded-2xl ${
                  isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                }`}
              >
                {message.content}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </span>
            </div>
            {isCurrentUser && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.sender.avatar_url || undefined} />
                <AvatarFallback>{message.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            )}
          </div>
        )
      })}
      <div ref={messagesEndRef} />
    </div>
  )
}
