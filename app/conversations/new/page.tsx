import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewConversationForm } from "@/components/conversations/new-conversation-form"

export default async function NewConversationPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Get all users except the current user
  const { data: users } = await supabase.from("users").select("*").neq("id", session.user.id)

  return (
    <div className="h-full p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-foreground">New Conversation</h1>
      <NewConversationForm users={users || []} />
    </div>
  )
}
