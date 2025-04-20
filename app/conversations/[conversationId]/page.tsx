import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatHeader } from "@/components/conversations/chat-header"
import { ChatMessages } from "@/components/conversations/chat-messages"
import { ChatInput } from "@/components/conversations/chat-input"

interface PageProps {
  params: {
    conversationId: string
  }
}

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = params
  const supabase = createClient()

  // Check if the conversation exists and the current user is a participant
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Check if the user is a participant in this conversation
  const { data: participantData } = await supabase
    .from("participants")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .single()

  if (!participantData) {
    return notFound()
  }

  // Get conversation details
  const { data: conversation } = await supabase
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
    .eq("id", conversationId)
    .single()

  if (!conversation) {
    return notFound()
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader conversation={conversation as any} />
      <ChatMessages conversationId={conversationId} />
      <ChatInput conversationId={conversationId} />
    </div>
  )
}
