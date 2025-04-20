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
import { ArrowLeft, Search } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: string
  username: string
  avatar_url: string | null
}

interface NewConversationFormProps {
  currentUserId: string
  users: User[]
}

export function NewConversationForm({ currentUserId, users }: NewConversationFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleUserToggle = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id)
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedUsers.length === 0 || isSubmitting) return
    if (isGroup && !groupName.trim()) return

    setIsSubmitting(true)

    try {
      // Create a new conversation
      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          name: isGroup ? groupName.trim() : null,
          is_group: isGroup,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      // Add participants (including current user)
      const participants = [
        { user_id: currentUserId, conversation_id: conversation.id },
        ...selectedUsers.map((user) => ({
          user_id: user.id,
          conversation_id: conversation.id,
        })),
      ]

      const { error: participantsError } = await supabase.from("participants").insert(participants)

      if (participantsError) throw participantsError

      // Show success toast notification
      toast({
        title: "Conversation created",
        description: isGroup
          ? `Group "${groupName}" has been successfully created.`
          : `Conversation with ${selectedUsers.map((u) => u.username).join(", ")} has been started.`,
        variant: "default",
      })

      router.push(`/chat/${conversation.id}`)
    } catch (error) {
      console.error("Error creating conversation:", error)

      // Show error toast notification
      toast({
        title: "Failed to create conversation",
        description: "An error occurred while creating the conversation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/chat")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#FD79A8] to-[#6C5CE7] text-transparent bg-clip-text">
          New Conversation
        </h1>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="is-group" checked={isGroup} onCheckedChange={(checked) => setIsGroup(checked === true)} />
              <Label htmlFor="is-group">Create a group chat</Label>
            </div>

            {isGroup && (
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  required={isGroup}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Users ({selectedUsers.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.username}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 rounded-full"
                        onClick={() => handleUserToggle(user)}
                      >
                        &times;
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border rounded-md divide-y divide-border max-h-[300px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No users found</div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id)
                  return (
                    <div
                      key={user.id}
                      className={`p-3 flex items-center gap-3 hover:bg-muted/50 cursor-pointer ${
                        isSelected ? "bg-muted/50" : ""
                      }`}
                      onClick={() => handleUserToggle(user)}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar>
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{user.username}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={selectedUsers.length === 0 || (isGroup && !groupName.trim()) || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Start Conversation"}
          </Button>
        </form>
      </div>
    </div>
  )
}
