import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import type { CustomColumnConfig } from '@/hooks/useDeckColumn';
import { useToast } from '@/hooks/useToast';
import { useUserSearch } from '@/hooks/useUserSearch';
import { nip19 } from 'nostr-tools';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface EditCustomColumnDialogProps {
  config: CustomColumnConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: CustomColumnConfig) => void;
}

export function EditCustomColumnDialog({ config, open, onOpenChange, onSave }: EditCustomColumnDialogProps) {
  const [title, setTitle] = useState('');
  const [authorSearchOpen, setAuthorSearchOpen] = useState(false);
  const { toast } = useToast();

  // Filter options
  const [kinds, setKinds] = useState<number[]>([1]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  // Temporary input states
  const [kindInput, setKindInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');

  // User search for autocomplete
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(authorInput);

  // Advanced options
  const [minTimestamp, setMinTimestamp] = useState('');
  const [maxTimestamp, setMaxTimestamp] = useState('');
  const [includeReplies, setIncludeReplies] = useState(true);
  const [includeReposts, setIncludeReposts] = useState(false);

  // Load existing config when dialog opens
  useEffect(() => {
    if (open && config) {
      setTitle(config.title);
      setKinds(config.customFilter.kinds || [1]);
      setAuthors(config.customFilter.authors || []);
      setHashtags(config.customFilter['#t'] || []);
      setSearch(config.customFilter.search || '');
      setLimit(config.customFilter.limit || 50);
      setIncludeReplies(config.includeReplies ?? true);

      // Check if reposts are included
      const hasReposts = config.customFilter.kinds?.includes(6) || config.customFilter.kinds?.includes(16);
      setIncludeReposts(hasReposts);

      // Parse timestamps
      if (config.customFilter.since) {
        const date = new Date(config.customFilter.since * 1000);
        setMinTimestamp(date.toISOString().slice(0, 16));
      } else {
        setMinTimestamp('');
      }

      if (config.customFilter.until) {
        const date = new Date(config.customFilter.until * 1000);
        setMaxTimestamp(date.toISOString().slice(0, 16));
      } else {
        setMaxTimestamp('');
      }
    }
  }, [open, config]);

  const addKind = () => {
    const kindNum = parseInt(kindInput);
    if (!isNaN(kindNum) && kindNum >= 0 && kindNum <= 65535) {
      if (!kinds.includes(kindNum)) {
        setKinds([...kinds, kindNum]);
      }
      setKindInput('');
    } else {
      toast({
        title: 'Invalid kind',
        description: 'Kind must be a number between 0 and 65535',
        variant: 'destructive',
      });
    }
  };

  const removeKind = (kind: number) => {
    setKinds(kinds.filter(k => k !== kind));
  };

  const addAuthor = (pubkey?: string) => {
    let targetPubkey = pubkey || authorInput.trim();
    
    if (!targetPubkey) return;

    // Try to decode if it's an npub or nprofile
    if (targetPubkey.startsWith('npub1')) {
      try {
        const decoded = nip19.decode(targetPubkey);
        if (decoded.type === 'npub') {
          targetPubkey = decoded.data;
        }
      } catch (error) {
        toast({
          title: 'Invalid npub',
          description: 'Could not decode npub.',
          variant: 'destructive',
        });
        return;
      }
    } else if (targetPubkey.startsWith('nprofile1')) {
      try {
        const decoded = nip19.decode(targetPubkey);
        if (decoded.type === 'nprofile') {
          targetPubkey = decoded.data.pubkey;
        }
      } catch (error) {
        toast({
          title: 'Invalid nprofile',
          description: 'Could not decode nprofile.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate hex pubkey only if not already 64 hex chars (could be from search)
    if (!/^[0-9a-f]{64}$/i.test(targetPubkey)) {
      toast({
        title: 'Invalid pubkey',
        description: 'Please search for a user or paste a valid hex pubkey/npub.',
        variant: 'destructive',
      });
      return;
    }

    if (!authors.includes(targetPubkey)) {
      setAuthors([...authors, targetPubkey]);
    }
    setAuthorInput('');
    setAuthorSearchOpen(false);
  };

  const removeAuthor = (pubkey: string) => {
    setAuthors(authors.filter(a => a !== pubkey));
  };

  const addHashtag = () => {
    let tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a column title.',
        variant: 'destructive',
      });
      return;
    }

    // Build custom filter
    const customFilter: any = {
      kinds: includeReposts ? [...kinds, 6, 16] : kinds,
      limit,
    };

    if (authors.length > 0) {
      customFilter.authors = authors;
    }

    if (hashtags.length > 0) {
      customFilter['#t'] = hashtags;
    }

    if (search.trim()) {
      customFilter.search = search.trim();
    }

    if (minTimestamp) {
      const timestamp = new Date(minTimestamp).getTime() / 1000;
      if (!isNaN(timestamp)) {
        customFilter.since = Math.floor(timestamp);
      }
    }

    if (maxTimestamp) {
      const timestamp = new Date(maxTimestamp).getTime() / 1000;
      if (!isNaN(timestamp)) {
        customFilter.until = Math.floor(timestamp);
      }
    }

    const updatedConfig: CustomColumnConfig = {
      ...config,
      title: title.trim(),
      customFilter,
      includeReplies,
    };

    onSave(updatedConfig);
    onOpenChange(false);

    toast({
      title: 'Column updated',
      description: `${title.trim()} column has been updated.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Custom Column</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your personalized feed filters.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-foreground">Column Title *</Label>
                <Input
                  id="title"
                  placeholder="My Custom Feed"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Give your column a descriptive name
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="kinds" className="text-foreground">Event Kinds</Label>
                <div className="flex gap-2">
                  <Input
                    id="kinds"
                    placeholder="1"
                    value={kindInput}
                    onChange={(e) => setKindInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKind())}
                    className="bg-muted/30 border-border/50"
                    type="number"
                  />
                  <Button onClick={addKind} variant="outline" className="border-primary/30">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {kinds.map((kind) => (
                    <Badge key={kind} variant="secondary" className="gap-1">
                      kind:{kind}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeKind(kind)}
                      />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  1 = Text Note, 6 = Repost, 7 = Reaction, 30023 = Article, etc.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit" className="text-foreground">Event Limit</Label>
                <Input
                  id="limit"
                  type="number"
                  min={10}
                  max={500}
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
                  className="bg-muted/30 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of events to fetch (10-500)
                </p>
              </div>
            </TabsContent>

            {/* Filters Tab */}
            <TabsContent value="filters" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="authors" className="text-foreground">Authors</Label>
                <div className="flex gap-2">
                  <Popover open={authorSearchOpen} onOpenChange={setAuthorSearchOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex-1 relative">
                        <Input
                          id="authors"
                          placeholder="Search by name or paste npub..."
                          value={authorInput}
                          onChange={(e) => {
                            setAuthorInput(e.target.value);
                            setAuthorSearchOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addAuthor();
                            }
                          }}
                          className="bg-muted/30 border-border/50"
                        />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                      <Command>
                        <CommandInput placeholder="Search users..." value={authorInput} onValueChange={setAuthorInput} />
                        <CommandList>
                          {isSearching ? (
                            <CommandEmpty>Searching...</CommandEmpty>
                          ) : searchResults.length === 0 && authorInput.length >= 2 ? (
                            <CommandEmpty>
                              No users found. Paste npub/hex pubkey to continue.
                            </CommandEmpty>
                          ) : authorInput.length < 2 ? (
                            <CommandEmpty>Type name or paste npub</CommandEmpty>
                          ) : (
                            <CommandGroup heading="Search Results">
                              {searchResults.map((user) => (
                                <CommandItem
                                  key={user.pubkey}
                                  value={user.pubkey}
                                  onSelect={() => addAuthor(user.pubkey)}
                                  className="flex items-center gap-2"
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={user.picture} />
                                    <AvatarFallback className="text-xs">
                                      {(user.name || user.display_name || 'U').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">
                                      {user.name || user.display_name || `${user.pubkey.slice(0, 8)}...`}
                                    </div>
                                    {user.nip05 && (
                                      <div className="text-xs text-muted-foreground truncate">
                                        {user.nip05}
                                      </div>
                                    )}
                                  </div>
                                  <Check className={cn("h-4 w-4", authors.includes(user.pubkey) ? "opacity-100" : "opacity-0")} />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button onClick={() => addAuthor()} variant="outline" className="border-primary/30">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2 max-h-24 overflow-y-auto">
                  {authors.map((author) => (
                    <Badge key={author} variant="secondary" className="gap-1 text-xs">
                      {author.slice(0, 8)}...
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeAuthor(author)}
                      />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Search by name or paste npub/hex pubkey
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="hashtags" className="text-foreground">Hashtags</Label>
                <div className="flex gap-2">
                  <Input
                    id="hashtags"
                    placeholder="nostr"
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                    className="bg-muted/30 border-border/50"
                  />
                  <Button onClick={addHashtag} variant="outline" className="border-primary/30">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      #{tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => removeHashtag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Filter by hashtags (events must match ALL hashtags)
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="search" className="text-foreground">Content Search</Label>
                <Textarea
                  id="search"
                  placeholder="bitcoin, lightning, zaps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-muted/30 border-border/50 min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Keywords to search in event content (relay support varies)
                </p>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Include Replies</Label>
                    <p className="text-xs text-muted-foreground">
                      Show events that are replies to other posts
                    </p>
                  </div>
                  <Switch
                    checked={includeReplies}
                    onCheckedChange={setIncludeReplies}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-foreground">Include Reposts</Label>
                    <p className="text-xs text-muted-foreground">
                      Show kind 6 and kind 16 reposts (adds to kinds automatically)
                    </p>
                  </div>
                  <Switch
                    checked={includeReposts}
                    onCheckedChange={setIncludeReposts}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="minTimestamp" className="text-foreground">Start Date (Since)</Label>
                  <Input
                    id="minTimestamp"
                    type="datetime-local"
                    value={minTimestamp}
                    onChange={(e) => setMinTimestamp(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only show events after this date/time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTimestamp" className="text-foreground">End Date (Until)</Label>
                  <Input
                    id="maxTimestamp"
                    type="datetime-local"
                    value={maxTimestamp}
                    onChange={(e) => setMaxTimestamp(e.target.value)}
                    className="bg-muted/30 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Only show events before this date/time
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-foreground">Quick Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setKinds([1]);
                        setTitle('Text Notes');
                      }}
                      className="border-border/50"
                    >
                      Text Notes Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setKinds([30023]);
                        setTitle('Long-form Articles');
                      }}
                      className="border-border/50"
                    >
                      Articles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setKinds([1]);
                        const lastWeek = new Date();
                        lastWeek.setDate(lastWeek.getDate() - 7);
                        setMinTimestamp(lastWeek.toISOString().slice(0, 16));
                        setTitle('Last 7 Days');
                      }}
                      className="border-border/50"
                    >
                      Last 7 Days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setKinds([1, 6, 16]);
                        setIncludeReposts(true);
                        setTitle('All Activity');
                      }}
                      className="border-border/50"
                    >
                      All Activity
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t border-border/30">
          <div className="text-xs text-muted-foreground">
            {kinds.length} kind{kinds.length !== 1 ? 's' : ''}, 
            {authors.length > 0 && ` ${authors.length} author${authors.length !== 1 ? 's' : ''}`}
            {hashtags.length > 0 && `, ${hashtags.length} tag${hashtags.length !== 1 ? 's' : ''}`}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
