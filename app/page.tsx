import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AuthForm } from "@/components/auth/auth-form"

export default async function Home() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect("/conversations")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-foreground">NextJS Messaging</h1>
        <p className="text-foreground-muted">Connect with friends in real-time</p>
      </div>
      <AuthForm />
    </main>
  )
}
