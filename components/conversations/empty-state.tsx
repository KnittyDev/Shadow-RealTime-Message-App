import { MessageSquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <MessageSquarePlus className="h-10 w-10 text-foreground-muted" />
      </div>
      <h3 className="text-2xl font-semibold text-foreground mb-2">No conversation selected</h3>
      <p className="text-foreground-muted mb-6 max-w-md">
        Select a conversation from the sidebar or start a new one to begin messaging.
      </p>
      <Button asChild>
        <Link href="/conversations/new">Start a new conversation</Link>
      </Button>
    </div>
  )
}
