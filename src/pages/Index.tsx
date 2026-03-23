import { useSeoMeta } from '@unhead/react';
import { NostrDeck } from '@/components/deck/NostrDeck';

const Index = () => {
  useSeoMeta({
    title: 'CyberDeck - Multi-Column Nostr Client',
    description: 'A browser-based TweetDeck-style Nostr client with multi-column layout, live updates, and Lightning zaps.',
  });

  return <NostrDeck />;
};

export default Index;
