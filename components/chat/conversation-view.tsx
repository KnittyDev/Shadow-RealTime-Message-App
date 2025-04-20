"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { ConversationHeader } from "@/components/chat/conversation-header"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { useToast } from "@/components/ui/use-toast"

interface ConversationViewProps {
  conversation: any
  initialMessages: any[]
  currentUserId: string
}

export function ConversationView({ conversation, initialMessages, currentUserId }: ConversationViewProps) {
  const [messages, setMessages] = useState(initialMessages)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    // Subscribe to new messages in this conversation
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from("messages")
            .select(`
              *,
              sender:sender_id(username, avatar_url)
            `)
            .eq("id", payload.new.id)
            .single()

          if (data) {
            setMessages((prev) => [...prev, data])
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, conversation.id])

  const handleSendMessage = async (content: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUserId,
          content,
        })
        .select(`
          *,
          sender:sender_id(username, avatar_url)
        `)
        .single()

      if (error) {
        throw error
      }

      // Update conversation's last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id)

      // Optimistically add the message to the UI
      if (data) {
        setMessages((prev) => [...prev, data])
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Show error toast notification
      toast({
        title: "Failed to send message",
        description: "An error occurred while sending your message. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <ConversationHeader conversation={conversation} currentUserId={currentUserId} />
      <MessageList messages={messages} currentUserId={currentUserId} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}
