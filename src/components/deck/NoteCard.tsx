import type { NostrEvent } from '@nostrify/nostrify';
import type { Event } from 'nostr-tools';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { NoteContent } from '@/components/NoteContent';
import { ZapButton } from '@/components/ZapButton';
import { ReplyDialog } from './ReplyDialog';
import { RepostButton } from './RepostButton';
import { ProfilePreviewDialog } from './ProfilePreviewDialog';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import type { ColumnConfig } from '@/hooks/useDeckColumn';

interface NoteCardProps {
  event: NostrEvent;
  onAddColumn?: (config: ColumnConfig) => void;
}

export function NoteCard({ event, onAddColumn }: NoteCardProps) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const [isNew, setIsNew] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const navigate = useNavigate();

  const displayName = metadata?.name || 
    metadata?.display_name || 
    `${event.pubkey.slice(0, 8)}...${event.pubkey.slice(-4)}`;
  
  const avatarUrl = metadata?.picture;
  const timestamp = formatDistanceToNow(new Date(event.created_at * 1000), { 
    addSuffix: true 
  });

  // Highlight new events briefly
  useEffect(() => {
    const now = Math.floor(Date.now() / 1000);
    if (event.created_at > now - 30) {
      setIsNew(true);
      const timer = setTimeout(() => setIsNew(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [event.created_at]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('video') ||
      target.tagName === 'IMG' ||
      target.closest('[data-profile-trigger]')
    ) {
      return;
    }

    // Navigate to note detail page
    const noteId = nip19.noteEncode(event.id);
    navigate(`/${noteId}`);
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowProfilePreview(true);
  };

  return (
    <Card 
      className={`group hover:border-primary/40 transition-all duration-200 bg-card/80 border-border/30 cursor-pointer ${
        isNew ? 'animate-slide-in border-primary/60 shadow-lg shadow-primary/20' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardContent className="p-2 md:p-3 space-y-1.5 md:space-y-2">
        {/* Author Info - Clickable */}
        <div 
          className="flex items-start gap-1.5 md:gap-2 cursor-pointer hover:bg-muted/30 -mx-2 md:-mx-3 px-2 md:px-3 py-1 rounded transition-colors"
          onClick={handleAuthorClick}
          data-profile-trigger
        >
          <Avatar className="h-7 w-7 md:h-8 md:w-8 border border-primary/20 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 md:gap-2">
              <span className="font-semibold text-xs md:text-sm text-foreground truncate hover:text-primary transition-colors">
                {displayName}
              </span>
              <span className="text-[10px] md:text-xs text-muted-foreground flex-shrink-0">
                {timestamp}
              </span>
            </div>
            {metadata?.nip05 && (
              <div className="text-[10px] md:text-xs text-primary/70 truncate">
                {metadata.nip05}
              </div>
            )}
          </div>
        </div>

        {/* Note Content */}
        <div className="text-xs md:text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed">
          <NoteContent event={event} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-0.5 md:pt-1">
          <ReplyDialog event={event} className="hover:text-primary hover:bg-primary/10" />
          <RepostButton event={event} className="hover:text-primary hover:bg-primary/10" />
          <ZapButton target={event as unknown as Event} />
        </div>
      </CardContent>

      {/* Profile Preview Dialog */}
      <ProfilePreviewDialog 
        pubkey={event.pubkey}
        open={showProfilePreview}
        onOpenChange={setShowProfilePreview}
        onAddColumn={onAddColumn}
      />
    </Card>
  );
}
