"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Paperclip, Send, Smile } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  conversationId: string
}

export function ChatInput({ conversationId }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || isSubmitting) return

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: message.trim(),
      })

      // Update the last_message_at timestamp in the conversation
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId)

      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
      <div className="flex items-end gap-2">
        <Button type="button" variant="ghost" size="icon" className="rounded-full">
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 min-h-[40px] max-h-[120px] bg-background text-foreground border-border"
          rows={1}
        />

        <Button type="button" variant="ghost" size="icon" className="rounded-full">
          <Smile className="h-5 w-5" />
        </Button>

        <Button type="submit" size="icon" className="rounded-full" disabled={!message.trim() || isSubmitting}>
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  )
}
