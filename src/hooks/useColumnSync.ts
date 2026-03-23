import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import type { ColumnConfig, CustomColumnConfig } from './useDeckColumn';
import type { NostrEvent } from '@nostrify/nostrify';

const COLUMN_CONFIG_D_TAG = 'cyberdeck-columns';

/**
 * Hook to sync column configurations with Nostr relays using NIP-78 (kind 30078)
 */
export function useColumnSync() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Fetch column configurations from relays
  const { data: remoteColumns, isLoading } = useQuery({
    queryKey: ['column-sync', user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!user) return null;

      console.log('[ColumnSync] Fetching column config from relays...');

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);

      const events = await nostr.query([{
        kinds: [30078],
        authors: [user.pubkey],
        '#d': [COLUMN_CONFIG_D_TAG],
        limit: 1,
      }], { signal: abortSignal });

      if (events.length === 0) {
        console.log('[ColumnSync] No remote column config found');
        return null;
      }

      const event = events[0];
      console.log('[ColumnSync] Found remote column config');

      try {
        const columns = JSON.parse(event.content) as Array<ColumnConfig | CustomColumnConfig>;
        console.log('[ColumnSync] Parsed', columns.length, 'columns');
        return columns;
      } catch (error) {
        console.error('[ColumnSync] Failed to parse column config:', error);
        return null;
      }
    },
    enabled: !!user,
    staleTime: 60000, // Cache for 1 minute
  });

  // Publish column configurations to relays
  const { mutateAsync: saveColumns, isPending: isSaving } = useMutation({
    mutationFn: async (columns: Array<ColumnConfig | CustomColumnConfig>) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      console.log('[ColumnSync] Publishing', columns.length, 'columns to relays...');

      const event = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(columns),
        tags: [
          ['d', COLUMN_CONFIG_D_TAG],
          ['alt', 'CyberDeck column configuration'],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(10000) });

      console.log('[ColumnSync] Column config published successfully');

      return event;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['column-sync', user?.pubkey] });
    },
  });

  return {
    remoteColumns,
    isLoading,
    saveColumns,
    isSaving,
  };
}
