"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogOut, MessageSquarePlus, Search, Users } from "lucide-react"
import { ConversationList } from "./conversation-list"
import type { Database } from "@/lib/database.types"
import { useMediaQuery } from "@/hooks/use-media-query"

type User = Database["public"]["Tables"]["users"]["Row"]

export function Sidebar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (data) {
          setCurrentUser(data)
        }
      }
    }

    fetchCurrentUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push("/")
  }

  const handleCreateConversation = () => {
    router.push("/conversations/new")
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const sidebarContent = (
    <>
      <div className="px-4 py-3 border-b border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleCreateConversation} title="New conversation">
              <MessageSquarePlus className="h-5 w-5 text-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => router.push("/conversations/users")} title="All users">
              <Users className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground-muted" />
          <Input
            placeholder="Search conversations"
            className="pl-8 bg-background text-foreground border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <ConversationList searchTerm={searchTerm} />
      </div>

      <div className="p-4 border-t border-border">
        {currentUser && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={currentUser.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{currentUser.username}</p>
                <p className="text-xs text-foreground-muted">{currentUser.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="h-5 w-5 text-foreground" />
            </Button>
          </div>
        )}
      </div>
    </>
  )

  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-card transform transition-transform duration-200 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarContent}
        </div>

        {isMobileMenuOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={toggleMobileMenu} />}

        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-50 rounded-full"
          onClick={toggleMobileMenu}
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </>
    )
  }

  return <div className="w-64 border-r border-border bg-card flex flex-col h-full">{sidebarContent}</div>
}
