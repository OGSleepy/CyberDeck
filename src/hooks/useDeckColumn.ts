import { useNostr } from '@nostrify/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import type { NostrFilter, NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';

export type ColumnType = 'latest' | 'worldwide' | 'hashtag' | 'author' | 'custom';

export interface ColumnConfig {
  id: string;
  type: ColumnType;
  title: string;
  value?: string; // hashtag or author pubkey
}

export interface CustomColumnConfig extends ColumnConfig {
  type: 'custom';
  customFilter: NostrFilter;
  includeReplies?: boolean;
}

const EVENTS_PER_PAGE = 20;

export function useDeckColumn(config: ColumnConfig | CustomColumnConfig) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [liveEvents, setLiveEvents] = useState<NostrEvent[]>([]);
  const [seenEventIds, setSeenEventIds] = useState<Set<string>>(new Set());

  // Build the base filter for this column
  const buildFilter = useCallback((until?: number, limit = EVENTS_PER_PAGE): NostrFilter | null => {
    // Handle custom columns
    if (config.type === 'custom') {
      const customConfig = config as CustomColumnConfig;
      return {
        ...customConfig.customFilter,
        limit: customConfig.customFilter.limit || limit,
        ...(until ? { until } : {}),
      };
    }

    // For "latest" (following), we need the user's contact list
    if (config.type === 'latest' && user) {
      return null; // Will be handled separately
    }

    // Build filter based on column type
    const filter: NostrFilter = (() => {
      switch (config.type) {
        case 'hashtag':
          return {
            kinds: [1],
            '#t': config.value ? [config.value] : [],
            limit,
            ...(until ? { until } : {}),
          };
        case 'author':
          return {
            kinds: [1],
            authors: config.value ? [config.value] : [],
            limit,
            ...(until ? { until } : {}),
          };
        case 'worldwide':
        default:
          return {
            kinds: [1],
            limit,
            ...(until ? { until } : {}),
          };
      }
    })();

    return filter;
  }, [config, user]);

  // Infinite query for pagination
  const query = useInfiniteQuery({
    queryKey: ['deck-column', config.id, config.type, config.value, user?.pubkey, 
               config.type === 'custom' ? JSON.stringify((config as CustomColumnConfig).customFilter) : ''],
    queryFn: async ({ pageParam, signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);

      // For "latest" (following), fetch contact list first
      if (config.type === 'latest' && user) {
        const contactListEvents = await nostr.query([{
          kinds: [3],
          authors: [user.pubkey],
          limit: 1,
        }], { signal: abortSignal });

        if (contactListEvents.length > 0) {
          const followingPubkeys = contactListEvents[0].tags
            .filter(([name]) => name === 'p')
            .map(([_, pubkey]) => pubkey);

          if (followingPubkeys.length > 0) {
            const events = await nostr.query([{
              kinds: [1],
              authors: followingPubkeys,
              limit: EVENTS_PER_PAGE,
              ...(pageParam ? { until: pageParam } : {}),
            }], { signal: abortSignal });
            
            return events.sort((a, b) => b.created_at - a.created_at);
          }
        }
        
        return [];
      }

      // Build filter for other types
      const filter = buildFilter(pageParam, EVENTS_PER_PAGE);
      if (!filter) return [];

      const events = await nostr.query([filter], { signal: abortSignal });

      // Apply reply filtering for custom columns if needed
      if (config.type === 'custom') {
        const customConfig = config as CustomColumnConfig;
        if (!customConfig.includeReplies) {
          const filtered = events.filter(event => {
            const hasReplyTag = event.tags.some(([name]) => name === 'e' || name === 'reply');
            return !hasReplyTag;
          });
          return filtered.sort((a, b) => b.created_at - a.created_at);
        }
      }

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) return undefined;
      // Use the oldest event's timestamp as the cursor for pagination
      const oldestTimestamp = lastPage[lastPage.length - 1].created_at;
      return oldestTimestamp;
    },
    enabled: config.type !== 'latest' || !!user,
    staleTime: 30000,
  });

  // Set up live subscription for new events
  useEffect(() => {
    if (config.type === 'latest' && !user) return;

    let isMounted = true;
    let sub: any;

    const setupSubscription = async () => {
      try {
        // For "latest", get following list first
        if (config.type === 'latest' && user) {
          const contactListEvents = await nostr.query([{
            kinds: [3],
            authors: [user.pubkey],
            limit: 1,
          }]);

          if (!isMounted) return;

          if (contactListEvents.length > 0) {
            const followingPubkeys = contactListEvents[0].tags
              .filter(([name]) => name === 'p')
              .map(([_, pubkey]) => pubkey);

            if (followingPubkeys.length > 0) {
              const now = Math.floor(Date.now() / 1000);
              sub = nostr.req([{
                kinds: [1],
                authors: followingPubkeys,
                since: now,
              }]);
            }
          }
        } else {
          // Build filter for live subscription
          const now = Math.floor(Date.now() / 1000);
          const filter = buildFilter(undefined, 1000); // High limit for subscription
          
          if (filter) {
            sub = nostr.req([{
              ...filter,
              limit: undefined, // Remove limit for subscriptions
              since: now,
            }]);
          }
        }

        if (!sub) return;

        // Listen for new events
        for await (const msg of sub) {
          if (!isMounted) break;
          
          if (msg[0] === 'EVENT') {
            const event = msg[2] as NostrEvent;
            
            // Apply custom filters if needed
            if (config.type === 'custom') {
              const customConfig = config as CustomColumnConfig;
              if (!customConfig.includeReplies) {
                const hasReplyTag = event.tags.some(([name]) => name === 'e' || name === 'reply');
                if (hasReplyTag) continue;
              }
            }

            // Deduplicate events
            setSeenEventIds(prev => {
              if (prev.has(event.id)) return prev;
              const newSet = new Set(prev);
              newSet.add(event.id);
              return newSet;
            });

            setLiveEvents(prev => {
              // Check if event already exists
              if (prev.some(e => e.id === event.id)) return prev;
              
              // Insert event in chronological order
              const newEvents = [...prev, event].sort((a, b) => b.created_at - a.created_at);
              
              // Keep only the most recent 50 live events to prevent memory issues
              return newEvents.slice(0, 50);
            });
          }
        }
      } catch (error) {
        // Ignore AbortError - it's expected when subscriptions are cleaned up
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Subscription error:', error);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (sub) {
        sub.return?.();
      }
    };
  }, [nostr, config, user, buildFilter]);

  // Merge paginated events with live events and deduplicate
  const allEvents = (() => {
    const paginated = query.data?.pages.flat() || [];
    const combined = [...liveEvents, ...paginated];
    
    // Deduplicate by event ID
    const seen = new Set<string>();
    const unique = combined.filter(event => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    });
    
    return unique.sort((a, b) => b.created_at - a.created_at);
  })();

  return {
    events: allEvents,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNewEvents: liveEvents.length > 0,
    requiresLogin: config.type === 'latest' && !user,
  };
}
