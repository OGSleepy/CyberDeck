import React, { useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useDeckColumn, type ColumnConfig, type CustomColumnConfig } from '@/hooks/useDeckColumn';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, X, Hash, User, Globe, Users, Sliders, Loader2, ArrowUp, Settings } from 'lucide-react';
import { NoteCard } from './NoteCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoginArea } from '@/components/auth/LoginArea';
import { EditColumnDialog } from './EditColumnDialog';
import { EditCustomColumnDialog } from './EditCustomColumnDialog';

interface DeckColumnProps {
  config: ColumnConfig | CustomColumnConfig;
  onRemove: () => void;
  onUpdate?: (config: ColumnConfig | CustomColumnConfig) => void;
  onAddColumn?: (config: ColumnConfig | CustomColumnConfig) => void;
}

export function DeckColumn({ config, onRemove, onUpdate, onAddColumn }: DeckColumnProps) {
  const { 
    events, 
    isLoading, 
    hasNewEvents, 
    refetch, 
    requiresLogin,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useDeckColumn(config);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const [showNewPostsButton, setShowNewPostsButton] = React.useState(false);
  const [isNearTop, setIsNearTop] = React.useState(true);
  const [showEditDialog, setShowEditDialog] = React.useState(false);

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  });

  // Load more when scrolling near the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Track scroll position to show "scroll to top" button and new posts indicator
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollArea) return;

    const handleScroll = () => {
      const scrollTop = scrollArea.scrollTop;
      setShowScrollTop(scrollTop > 500);
      setIsNearTop(scrollTop < 100);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // Show "new posts" button when new events arrive and user is not at top
  useEffect(() => {
    if (hasNewEvents && !isNearTop) {
      setShowNewPostsButton(true);
    } else {
      setShowNewPostsButton(false);
    }
  }, [hasNewEvents, isNearTop]);

  const scrollToTop = () => {
    const scrollArea = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getIcon = () => {
    switch (config.type) {
      case 'hashtag':
        return <Hash className="h-4 w-4" />;
      case 'author':
        return <User className="h-4 w-4" />;
      case 'latest':
        return <Users className="h-4 w-4" />;
      case 'custom':
        return <Sliders className="h-4 w-4" />;
      case 'worldwide':
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border/50 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow relative">
      {/* Column Header */}
      <div className="flex items-center justify-between p-2 md:p-3 border-b border-border/50 bg-muted/30 backdrop-blur-sm">
        <div className="flex items-center gap-1.5 md:gap-2 flex-1 min-w-0">
          <div className="text-primary text-sm md:text-base">{getIcon()}</div>
          <h3 className="font-bold text-xs md:text-sm truncate text-foreground">
            {config.title}
          </h3>
          {hasNewEvents && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
              <span className="text-[10px] md:text-xs text-primary font-semibold">LIVE</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 md:gap-1">
          {onUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 md:h-7 md:w-7 hover:bg-primary/20 hover:text-primary"
              onClick={() => setShowEditDialog(true)}
            >
              <Settings className="h-3 w-3 md:h-3.5 md:w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-7 md:w-7 hover:bg-primary/20 hover:text-primary"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3 w-3 md:h-3.5 md:w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 md:h-7 md:w-7 hover:bg-destructive/20 hover:text-destructive"
            onClick={onRemove}
          >
            <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2">
          {requiresLogin ? (
            <Card className="p-4 md:p-6 text-center bg-muted/20 border-border/30 border-dashed">
              <div className="space-y-3 md:space-y-4">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Log in to see posts from users you follow
                </p>
                <div className="flex justify-center">
                  <LoginArea className="max-w-full md:max-w-60" />
                </div>
              </div>
            </Card>
          ) : isLoading && events.length === 0 ? (
            <>
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-2 md:p-3 space-y-1.5 md:space-y-2 bg-muted/20 border-border/30">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Skeleton className="h-7 w-7 md:h-8 md:w-8 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-2.5 md:h-3 w-20 md:w-24" />
                      <Skeleton className="h-2 w-12 md:w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-12 md:h-16 w-full" />
                </Card>
              ))}
            </>
          ) : events.length === 0 ? (
            <Card className="p-4 md:p-6 text-center bg-muted/20 border-border/30 border-dashed">
              <p className="text-xs md:text-sm text-muted-foreground">
                {config.type === 'latest' 
                  ? "You're not following anyone yet. Follow users to see their posts here."
                  : "No events found. Try refreshing or check your relay connections."}
              </p>
            </Card>
          ) : (
            <>
              {events.map((event) => (
                <NoteCard key={event.id} event={event} onAddColumn={onAddColumn} />
              ))}
              
              {/* Load More Trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="py-4 flex justify-center">
                  {isFetchingNextPage ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more...</span>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchNextPage()}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      Load More
                    </Button>
                  )}
                </div>
              )}

              {/* End of feed indicator */}
              {!hasNextPage && events.length > 0 && (
                <div className="py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    You've reached the end
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* New Posts Button */}
      {showNewPostsButton && (
        <Button
          variant="default"
          size="sm"
          className="absolute top-16 left-1/2 -translate-x-1/2 shadow-lg bg-primary hover:bg-primary/90 z-10 animate-slide-in"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-4 w-4 mr-2" />
          New Posts
        </Button>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          variant="default"
          size="icon"
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-10"
          onClick={scrollToTop}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Edit Column Dialogs */}
      {onUpdate && (
        <>
          {config.type === 'custom' ? (
            <EditCustomColumnDialog
              config={config as CustomColumnConfig}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              onSave={onUpdate}
            />
          ) : (
            <EditColumnDialog
              config={config}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              onSave={onUpdate}
            />
          )}
        </>
      )}
    </Card>
  );
}
