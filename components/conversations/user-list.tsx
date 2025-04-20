"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import type { Database } from "@/lib/database.types"

type User = Database["public"]["Tables"]["users"]["Row"]

interface UserListProps {
  users: User[]
}

export function UserList({ users }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const startConversation = async (userId: string) => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) return

      // Check if a conversation already exists
      const { data: currentUserParticipations } = await supabase
        .from("participants")
        .select("conversation_id")
        .eq("user_id", currentUser.id)

      if (currentUserParticipations && currentUserParticipations.length > 0) {
        const conversationIds = currentUserParticipations.map((p) => p.conversation_id)

        const { data: existingConversations } = await supabase
          .from("participants")
          .select("conversation_id")
          .eq("user_id", userId)
          .in("conversation_id", conversationIds)

        if (existingConversations && existingConversations.length > 0) {
          for (const participation of existingConversations) {
            const { data: conversation } = await supabase
              .from("conversations")
              .select("*")
              .eq("id", participation.conversation_id)
              .eq("is_group", false)
              .single()

            if (conversation) {
              router.push(`/conversations/${conversation.id}`)
              return
            }
          }
        }
      }

      // Create a new conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .insert({
          is_group: false,
        })
        .select()
        .single()

      if (!conversation) throw new Error("Failed to create conversation")

      // Add participants
      await supabase.from("participants").insert([
        {
          conversation_id: conversation.id,
          user_id: currentUser.id,
        },
        {
          conversation_id: conversation.id,
          user_id: userId,
        },
      ])

      router.push(`/conversations/${conversation.id}`)
    } catch (error) {
      console.error("Error starting conversation:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-foreground-muted" />
        <Input
          placeholder="Search users"
          className="pl-8 bg-background text-foreground border-border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.username}</p>
                  <p className="text-xs text-foreground-muted">{user.email}</p>
                </div>
              </div>
              <Button size="sm" onClick={() => startConversation(user.id)}>
                Message
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground-muted">No users found</p>
        </div>
      )}
    </div>
  )
}
