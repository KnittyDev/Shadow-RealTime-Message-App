import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatLayout } from "@/components/chat/chat-layout"

export default async function ChatPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Get user data
  const { data: userData } = await supabase.from("users").select("*").eq("id", userId).single()

  // Get all conversations where the user is a participant
  const { data: participantData } = await supabase.from("participants").select("conversation_id").eq("user_id", userId)

  const conversationIds = participantData?.map((p) => p.conversation_id) || []

  // Get conversation details
  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      *,
      participants(
        user_id,
        users:user_id(id, username, avatar_url)
      ),
      last_message:messages(content, created_at)
    `)
    .in("id", conversationIds.length > 0 ? conversationIds : ["no-conversations"])
    .order("last_message_at", { ascending: false })

  // Process conversations to get the latest message
  const processedConversations =
    conversations?.map((conv) => {
      const lastMessage =
        conv.last_message && conv.last_message.length > 0
          ? conv.last_message.sort(
              (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )[0]
          : null

      return {
        ...conv,
        last_message: lastMessage,
      }
    }) || []

  return <ChatLayout user={userData} conversations={processedConversations} />
}
