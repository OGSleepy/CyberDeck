import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

export function useNote(eventId: string) {
  const { nostr } = useNostr();

  return useQuery<NostrEvent | null, Error>({
    queryKey: ['note', eventId],
    staleTime: 60000, // 60 seconds
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for the specific event by ID
      const events = await nostr.query(
        [
          {
            ids: [eventId],
            limit: 1,
          },
        ],
        { signal }
      );

      return events[0] || null;
    },
    enabled: !!eventId,
  });
}
