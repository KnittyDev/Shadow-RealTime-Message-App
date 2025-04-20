"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import type { Database } from "@/lib/database.types"

type User = Database["public"]["Tables"]["users"]["Row"]

interface NewConversationFormProps {
  users: User[]
}

export function NewConversationForm({ users }: NewConversationFormProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedUsers.length === 0 || isSubmitting) return
    if (isGroup && !groupName.trim()) return

    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if a direct message conversation already exists
      if (!isGroup && selectedUsers.length === 1) {
        // Get all conversations where the current user is a participant
        const { data: currentUserParticipations } = await supabase
          .from("participants")
          .select("conversation_id")
          .eq("user_id", user.id)

        if (currentUserParticipations && currentUserParticipations.length > 0) {
          const conversationIds = currentUserParticipations.map((p) => p.conversation_id)

          // Check if the selected user is also a participant in any of these conversations
          const { data: existingConversations } = await supabase
            .from("participants")
            .select("conversation_id")
            .eq("user_id", selectedUsers[0])
            .in("conversation_id", conversationIds)

          if (existingConversations && existingConversations.length > 0) {
            // Get the first conversation that is not a group
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
      }

      // Create a new conversation
      const { data: conversation } = await supabase
        .from("conversations")
        .insert({
          name: isGroup ? groupName : null,
          is_group: isGroup,
        })
        .select()
        .single()

      if (!conversation) throw new Error("Failed to create conversation")

      // Add all participants including the current user
      const participants = [
        ...selectedUsers.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
        })),
        {
          conversation_id: conversation.id,
          user_id: user.id,
        },
      ]

      await supabase.from("participants").insert(participants)

      router.push(`/conversations/${conversation.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox id="is-group" checked={isGroup} onCheckedChange={(checked) => setIsGroup(checked === true)} />
          <Label htmlFor="is-group" className="text-foreground">
            Create a group chat
          </Label>
        </div>

        {isGroup && (
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-foreground">
              Group Name
            </Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="bg-background text-foreground border-border"
              required={isGroup}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Select Users</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {users.map((user) => (
            <Card
              key={user.id}
              className={`cursor-pointer transition-colors ${
                selectedUsers.includes(user.id) ? "border-primary" : "border-border"
              }`}
              onClick={() => toggleUser(user.id)}
            >
              <CardContent className="p-4 flex items-center space-x-3">
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                  className="pointer-events-none"
                />
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        disabled={selectedUsers.length === 0 || (isGroup && !groupName.trim()) || isSubmitting}
        className="w-full md:w-auto"
      >
        {isSubmitting ? "Creating..." : "Create Conversation"}
      </Button>
    </form>
  )
}
