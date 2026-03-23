import { useParams, Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useNote } from '@/hooks/useNote';
import { useReplies } from '@/hooks/useReplies';
import { useAuthor } from '@/hooks/useAuthor';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteContent } from '@/components/NoteContent';
import { ZapButton } from '@/components/ZapButton';
import { ReplyDialog } from '@/components/deck/ReplyDialog';
import { RepostButton } from '@/components/deck/RepostButton';
import { ProfilePreviewDialog } from '@/components/deck/ProfilePreviewDialog';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import NotFound from './NotFound';
import type { Event } from 'nostr-tools';
import { useState } from 'react';

export function NoteDetail() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let eventId: string;
  try {
    const decoded = nip19.decode(identifier);
    if (decoded.type === 'note') {
      eventId = decoded.data;
    } else if (decoded.type === 'nevent') {
      eventId = decoded.data.id;
    } else {
      return <NotFound />;
    }
  } catch {
    return <NotFound />;
  }

  const { data: note, isLoading: noteLoading, error: noteError } = useNote(eventId);
  const { data: replies = [], isLoading: repliesLoading } = useReplies(eventId);

  if (noteError || (!noteLoading && !note)) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-lg shadow-primary/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="hover:bg-primary/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground">Note</h1>
            <p className="text-xs text-muted-foreground">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Main Note */}
        {noteLoading ? (
          <Card>
            <CardHeader>
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </CardContent>
          </Card>
        ) : note ? (
          <MainNote event={note} />
        ) : null}

        {/* Reply Form */}
        {note && (
          <Card className="border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <ReplyDialog event={note}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Write a Reply
                </Button>
              </ReplyDialog>
            </CardContent>
          </Card>
        )}

        {/* Replies */}
        <div className="space-y-3">
          {repliesLoading ? (
            <>
              <ReplyCardSkeleton />
              <ReplyCardSkeleton />
            </>
          ) : replies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground text-sm">
                  No replies yet. Be the first to share your thoughts!
                </p>
              </CardContent>
            </Card>
          ) : (
            replies.map((reply) => (
              <ReplyCard key={reply.id} event={reply} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function MainNote({ event }: { event: any }) {
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || 
    metadata?.display_name || 
    `${event.pubkey.slice(0, 8)}...${event.pubkey.slice(-4)}`;
  
  const avatarUrl = metadata?.picture;
  const timestamp = new Date(event.created_at * 1000);

  return (
    <>
      <Card className="border-primary/20">
        <CardHeader>
          <div 
            className="flex items-start gap-3 cursor-pointer hover:bg-muted/30 -mx-6 px-6 py-2 rounded transition-colors"
            onClick={() => setShowProfilePreview(true)}
          >
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-base text-foreground truncate hover:text-primary transition-colors">
                  {displayName}
                </span>
              </div>
              {metadata?.nip05 && (
                <div className="text-xs text-primary/70 truncate mb-1">
                  {metadata.nip05}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {timestamp.toLocaleDateString()} at {timestamp.toLocaleTimeString()} · {formatDistanceToNow(timestamp, { addSuffix: true })}
              </div>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-base text-foreground break-words whitespace-pre-wrap leading-relaxed">
          <NoteContent event={event} />
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-border/30">
          <ReplyDialog event={event}>
            <Button variant="ghost" size="sm" className="hover:text-primary hover:bg-primary/10">
              <MessageSquare className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </ReplyDialog>
          <RepostButton event={event} className="hover:text-primary hover:bg-primary/10" />
          <ZapButton target={event as unknown as Event} />
        </div>
      </CardContent>
    </Card>

    <ProfilePreviewDialog 
      pubkey={event.pubkey}
      open={showProfilePreview}
      onOpenChange={setShowProfilePreview}
    />
    </>
  );
}

function ReplyCard({ event }: { event: any }) {
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || 
    metadata?.display_name || 
    `${event.pubkey.slice(0, 8)}...${event.pubkey.slice(-4)}`;
  
  const avatarUrl = metadata?.picture;
  const timestamp = formatDistanceToNow(new Date(event.created_at * 1000), { 
    addSuffix: true 
  });

  return (
    <>
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-2">
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowProfilePreview(true)}
            >
              <Avatar className="h-8 w-8 border border-primary/20 flex-shrink-0">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span 
                  className="font-semibold text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setShowProfilePreview(true)}
                >
                  {displayName}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {timestamp}
                </span>
              </div>
              {metadata?.nip05 && (
                <div className="text-xs text-primary/70 truncate mb-1">
                  {metadata.nip05}
                </div>
              )}
            <div className="text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed">
              <NoteContent event={event} />
            </div>
            <div className="flex items-center gap-1 pt-2">
              <ReplyDialog event={event} className="hover:text-primary hover:bg-primary/10" />
              <RepostButton event={event} className="hover:text-primary hover:bg-primary/10" />
              <ZapButton target={event as unknown as Event} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <ProfilePreviewDialog 
      pubkey={event.pubkey}
      open={showProfilePreview}
      onOpenChange={setShowProfilePreview}
    />
    </>
  );
}

function ReplyCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-2">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
