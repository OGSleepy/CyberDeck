import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

interface UserSearchResult {
  pubkey: string;
  name?: string;
  display_name?: string;
  nip05?: string;
  picture?: string;
}

export function useUserSearch(query: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return useQuery({
    queryKey: ['user-search', debouncedQuery, user?.pubkey],
    queryFn: async ({ signal }) => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return [];
      }

      console.log('[UserSearch] Searching for:', debouncedQuery);

      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
      const searchLower = debouncedQuery.toLowerCase();

      let followingPubkeys: string[] = [];

      // If logged in, get user's following list first (prioritize these in search)
      if (user) {
        try {
          console.log('[UserSearch] Fetching following list...');
          const contactListEvents = await nostr.query([{
            kinds: [3],
            authors: [user.pubkey],
            limit: 1,
          }], { signal: abortSignal });

          if (contactListEvents.length > 0) {
            followingPubkeys = contactListEvents[0].tags
              .filter(([name]) => name === 'p')
              .map(([_, pubkey]) => pubkey);
            console.log('[UserSearch] Found', followingPubkeys.length, 'follows');
          }
        } catch (error) {
          console.error('[UserSearch] Failed to fetch following list:', error);
        }
      }

      // Fetch profiles for people you follow
      let followingProfiles: NostrEvent[] = [];
      if (followingPubkeys.length > 0) {
        try {
          console.log('[UserSearch] Fetching profiles of people you follow...');
          followingProfiles = await nostr.query([{
            kinds: [0],
            authors: followingPubkeys,
          }], { signal: abortSignal });
          console.log('[UserSearch] Fetched', followingProfiles.length, 'following profiles');
        } catch (error) {
          console.error('[UserSearch] Failed to fetch following profiles:', error);
        }
      }

      // Try NIP-50 search query first (if relay supports it)
      let searchResults: NostrEvent[] = [];
      try {
        console.log('[UserSearch] Trying NIP-50 search...');
        searchResults = await nostr.query([{
          kinds: [0],
          search: debouncedQuery,
          limit: 100,
        }], { signal: abortSignal });
        console.log('[UserSearch] NIP-50 search returned', searchResults.length, 'results');
      } catch (error) {
        console.log('[UserSearch] NIP-50 search not supported or failed, falling back to broad query');
      }

      // Also fetch recent profiles from the network as fallback
      let recentProfiles: NostrEvent[] = [];
      try {
        console.log('[UserSearch] Fetching recent profiles from network...');
        recentProfiles = await nostr.query([{
          kinds: [0],
          limit: 1000, // Increased to 1000 for better coverage
        }], { signal: abortSignal });
        console.log('[UserSearch] Fetched', recentProfiles.length, 'recent profiles');
      } catch (error) {
        console.error('[UserSearch] Failed to fetch recent profiles:', error);
      }

      // Combine all sources and deduplicate profiles (keep only latest for each pubkey)
      const allProfiles = [...followingProfiles, ...searchResults, ...recentProfiles];
      console.log('[UserSearch] Total profiles to process:', allProfiles.length);
      
      const latestByPubkey = new Map<string, NostrEvent>();
      
      for (const event of allProfiles) {
        const existing = latestByPubkey.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          latestByPubkey.set(event.pubkey, event);
        }
      }

      console.log('[UserSearch] Deduplicated to', latestByPubkey.size, 'unique profiles');

      // Parse and filter profiles by search query
      const results: UserSearchResult[] = [];

      for (const event of latestByPubkey.values()) {
        try {
          const metadata = JSON.parse(event.content);
          const name = metadata.name?.toLowerCase() || '';
          const displayName = metadata.display_name?.toLowerCase() || '';
          const nip05 = metadata.nip05?.toLowerCase() || '';

          // Check if name, display_name, or nip05 matches the search query
          if (
            name.includes(searchLower) ||
            displayName.includes(searchLower) ||
            nip05.includes(searchLower)
          ) {
            results.push({
              pubkey: event.pubkey,
              name: metadata.name,
              display_name: metadata.display_name,
              nip05: metadata.nip05,
              picture: metadata.picture,
            });
          }
        } catch (error) {
          // Skip events with invalid JSON
          continue;
        }
      }

      console.log('[UserSearch] Found', results.length, 'matching profiles');

      // Sort by relevance with priority: following > exact match > starts with > contains
      const sorted = results.sort((a, b) => {
        const aName = (a.name || a.display_name || '').toLowerCase();
        const bName = (b.name || b.display_name || '').toLowerCase();
        const aNip05 = (a.nip05 || '').toLowerCase();
        const bNip05 = (b.nip05 || '').toLowerCase();

        // Prioritize people you follow
        const aIsFollowing = followingPubkeys.includes(a.pubkey);
        const bIsFollowing = followingPubkeys.includes(b.pubkey);
        if (aIsFollowing && !bIsFollowing) return -1;
        if (bIsFollowing && !aIsFollowing) return 1;

        // Exact NIP-05 match
        const aNip05Exact = aNip05 === searchLower;
        const bNip05Exact = bNip05 === searchLower;
        if (aNip05Exact && !bNip05Exact) return -1;
        if (bNip05Exact && !aNip05Exact) return 1;

        // Exact name match
        const aNameExact = aName === searchLower;
        const bNameExact = bName === searchLower;
        if (aNameExact && !bNameExact) return -1;
        if (bNameExact && !aNameExact) return 1;

        // NIP-05 starts with
        const aNip05Starts = aNip05.startsWith(searchLower);
        const bNip05Starts = bNip05.startsWith(searchLower);
        if (aNip05Starts && !bNip05Starts) return -1;
        if (bNip05Starts && !aNip05Starts) return 1;

        // Name starts with
        const aNameStarts = aName.startsWith(searchLower);
        const bNameStarts = bName.startsWith(searchLower);
        if (aNameStarts && !bNameStarts) return -1;
        if (bNameStarts && !aNameStarts) return 1;

        // Fallback to alphabetical
        return aName.localeCompare(bName);
      }).slice(0, 20); // Show top 20 results

      console.log('[UserSearch] Returning', sorted.length, 'sorted results');
      return sorted;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30000, // Cache results for 30 seconds
    retry: 2, // Retry twice on failure
  });
}
