import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewConversationForm } from "@/components/chat/new-conversation-form"

export default async function NewConversationPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const userId = session.user.id

  // Get all users except current user
  const { data: users } = await supabase.from("users").select("*").neq("id", userId).order("username")

  return (
    <div className="flex flex-col h-screen bg-background">
      <NewConversationForm currentUserId={userId} users={users || []} />
    </div>
  )
}
