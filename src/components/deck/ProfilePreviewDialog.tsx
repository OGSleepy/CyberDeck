import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ExternalLink } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { NoteContent } from '@/components/NoteContent';
import { formatDistanceToNow } from 'date-fns';
import { nip19 } from 'nostr-tools';
import type { NostrEvent } from '@nostrify/nostrify';
import type { ColumnConfig } from '@/hooks/useDeckColumn';

interface ProfilePreviewDialogProps {
  pubkey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddColumn?: (config: ColumnConfig) => void;
}

export function ProfilePreviewDialog({ 
  pubkey, 
  open, 
  onOpenChange,
  onAddColumn 
}: ProfilePreviewDialogProps) {
  const { data: author, isLoading: authorLoading } = useAuthor(pubkey);
  const { nostr } = useNostr();

  // Fetch user's recent posts
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', pubkey],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
      const events = await nostr.query([{
        kinds: [1],
        authors: [pubkey],
        limit: 10,
      }], { signal: abortSignal });
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: open && !!pubkey,
  });

  const metadata = author?.metadata;
  const displayName = metadata?.name || metadata?.display_name || `${pubkey.slice(0, 8)}...`;
  const npub = nip19.npubEncode(pubkey);

  const handleAddColumn = () => {
    if (onAddColumn) {
      const config: ColumnConfig = {
        id: `author-${Date.now()}`,
        type: 'author',
        title: `@${displayName}`,
        value: pubkey,
      };
      onAddColumn(config);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 bg-card border-border/50 overflow-hidden">
        {authorLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ) : (
          <>
            {/* Banner & Profile Header */}
            <div className="relative">
              {metadata?.banner ? (
                <div 
                  className="h-32 bg-cover bg-center"
                  style={{ backgroundImage: `url(${metadata.banner})` }}
                />
              ) : (
                <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5" />
              )}
              
              <div className="absolute -bottom-12 left-6">
                <Avatar className="h-24 w-24 border-4 border-card">
                  <AvatarImage src={metadata?.picture} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Profile Info */}
            <div className="pt-14 px-6 pb-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-foreground truncate">
                    {displayName}
                  </h2>
                  {metadata?.nip05 && (
                    <p className="text-sm text-primary/70 truncate">
                      {metadata.nip05}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                    {npub.slice(0, 20)}...
                  </p>
                </div>

                {onAddColumn && (
                  <Button
                    onClick={handleAddColumn}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                )}
              </div>

              {metadata?.about && (
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {metadata.about}
                </p>
              )}

              {metadata?.website && (
                <a 
                  href={metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {metadata.website}
                </a>
              )}
            </div>

            {/* Recent Posts */}
            <div className="border-t border-border/50 px-6 py-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Posts</h3>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {postsLoading ? (
                    <>
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="p-3">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                          </div>
                        </Card>
                      ))}
                    </>
                  ) : posts.length === 0 ? (
                    <Card className="border-dashed">
                      <CardContent className="py-8 text-center">
                        <p className="text-sm text-muted-foreground">
                          No recent posts found
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    posts.map((post) => (
                      <Card key={post.id} className="hover:border-primary/40 transition-colors">
                        <CardContent className="p-3 space-y-2">
                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at * 1000), { addSuffix: true })}
                          </div>
                          <div className="text-sm text-foreground/90 break-words whitespace-pre-wrap leading-relaxed line-clamp-4">
                            <NoteContent event={post} />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
