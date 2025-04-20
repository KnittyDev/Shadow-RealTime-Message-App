import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserList } from "@/components/conversations/user-list"

export default async function UsersPage() {
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
      <h1 className="text-2xl font-bold mb-6 text-foreground">All Users</h1>
      <UserList users={users || []} />
    </div>
  )
}
