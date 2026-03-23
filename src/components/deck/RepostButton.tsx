import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useToast } from '@/hooks/useToast';
import { Repeat2, Loader2 } from 'lucide-react';
import type { NostrEvent } from '@nostrify/nostrify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RepostButtonProps {
  event: NostrEvent;
  className?: string;
}

export function RepostButton({ event, className }: RepostButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { user } = useCurrentUser();
  const { mutate: publish, isPending } = useNostrPublish();
  const { toast } = useToast();

  // Don't show repost button if user is not logged in or is the author
  if (!user || user.pubkey === event.pubkey) {
    return null;
  }

  const handleRepost = () => {
    // Determine the kind of repost based on the original event kind
    // kind 6 for kind 1 notes, kind 16 for other events
    const repostKind = event.kind === 1 ? 6 : 16;
    
    // Build the repost event
    const tags: string[][] = [
      ['e', event.id, '', ''], // Event being reposted
      ['p', event.pubkey], // Author of the reposted event
    ];

    // For kind 16 generic reposts, add the 'k' tag
    if (repostKind === 16) {
      tags.push(['k', event.kind.toString()]);
    }

    // For addressable events (kind 30000-39999), include the 'a' tag
    if (event.kind >= 30000 && event.kind < 40000) {
      const dTag = event.tags.find(([name]) => name === 'd')?.[1];
      if (dTag) {
        tags.push(['a', `${event.kind}:${event.pubkey}:${dTag}`]);
      }
    }

    publish(
      {
        kind: repostKind,
        content: JSON.stringify(event), // Stringified JSON of the reposted event
        tags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Reposted',
            description: 'The note has been reposted to your followers.',
          });
          setShowDialog(false);
        },
        onError: (error) => {
          toast({
            title: 'Failed to repost',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={() => setShowDialog(true)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Repeat2 className="h-4 w-4" />
        )}
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Repost this note?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will share the note with your followers. The original author will be credited.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRepost}
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reposting...
                </>
              ) : (
                <>
                  <Repeat2 className="h-4 w-4 mr-2" />
                  Repost
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
