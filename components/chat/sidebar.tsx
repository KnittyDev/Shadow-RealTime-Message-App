"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut, MessageSquarePlus, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface SidebarProps {
  user: any
  conversations: any[]
}

export function Sidebar({ user, conversations: initialConversations }: SidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [conversations, setConversations] = useState(initialConversations)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()

      // Show success toast notification
      toast({
        title: "Sign out successful",
        description: "You have successfully signed out of your account.",
        variant: "default",
      })

      router.push("/login")
      router.refresh()
    } catch (error) {
      // Show error toast notification
      toast({
        title: "Sign out failed",
        description: "An error occurred while signing out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCreateConversation = () => {
    router.push("/chat/new")
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true

    // For group chats, search by name
    if (conv.is_group && conv.name) {
      return conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    }

    // For direct messages, search by username
    const otherParticipants = conv.participants.filter((p: any) => p.user_id !== user.id)
    return otherParticipants.some((p: any) => p.users.username.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  const getConversationName = (conversation: any) => {
    if (conversation.is_group) return conversation.name

    const otherParticipants = conversation.participants.filter((p: any) => p.user_id !== user.id)
    return otherParticipants.map((p: any) => p.users.username).join(", ")
  }

  const getAvatarInfo = (conversation: any) => {
    if (conversation.is_group) {
      return {
        src: null,
        fallback: conversation.name?.substring(0, 2).toUpperCase() || "GC",
      }
    }

    const otherParticipant = conversation.participants.find((p: any) => p.user_id !== user.id)?.users
    return {
      src: otherParticipant?.avatar_url,
      fallback: otherParticipant?.username.substring(0, 2).toUpperCase() || "??",
    }
  }

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium bg-gradient-to-r from-[#FD79A8] to-[#6C5CE7] text-transparent bg-clip-text">
              Shadow App
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleCreateConversation} title="New conversation">
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations"
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No conversations found" : "No conversations yet"}
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const avatarInfo = getAvatarInfo(conversation)
            return (
              <button
                key={conversation.id}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors border-b border-border"
                onClick={() => router.push(`/chat/${conversation.id}`)}
              >
                <Avatar>
                  <AvatarImage src={avatarInfo.src || undefined} />
                  <AvatarFallback>{avatarInfo.fallback}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left truncate">
                  <div className="font-medium">{getConversationName(conversation)}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {conversation.last_message?.content || "No messages yet"}
                  </div>
                </div>
                {conversation.last_message && (
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
