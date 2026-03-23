import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

export function useReplies(eventId: string) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent[], Error>({
    queryKey: ['replies', eventId],
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for replies (kind 1 events that reference this event in an 'e' tag)
      const events = await nostr.query(
        [
          {
            kinds: [1],
            '#e': [eventId],
            limit: 100,
          },
        ],
        { signal }
      );

      // Sort by created_at (oldest first for chronological reading)
      return events.sort((a, b) => a.created_at - b.created_at);
    },
    enabled: !!eventId,
  });
}
