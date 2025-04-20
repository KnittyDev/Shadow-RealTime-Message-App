import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConversationView } from "@/components/chat/conversation-view"

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Check if user is a participant in this conversation
  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("conversation_id", params.conversationId)
    .eq("user_id", userId)
    .single()

  if (!participant) {
    redirect("/chat")
  }

  // Get conversation details with participants
  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      *,
      participants(
        user_id,
        users:user_id(id, username, avatar_url)
      )
    `)
    .eq("id", params.conversationId)
    .single()

  if (!conversation) {
    redirect("/chat")
  }

  // Get initial messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id(username, avatar_url)
    `)
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true })

  return <ConversationView conversation={conversation} initialMessages={messages || []} currentUserId={userId} />
}
