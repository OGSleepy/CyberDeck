import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Check } from 'lucide-react';
import type { ColumnConfig, ColumnType } from '@/hooks/useDeckColumn';
import { useToast } from '@/hooks/useToast';
import { useUserSearch } from '@/hooks/useUserSearch';
import { nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';

interface AddColumnDialogProps {
  onAdd: (config: ColumnConfig) => void;
}

export function AddColumnDialog({ onAdd }: AddColumnDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ColumnType>('latest');
  const [value, setValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const { toast } = useToast();
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(value);

  const handleAdd = () => {
    let columnValue = value.trim();
    let title = '';

    // Validate based on type
    if (type === 'hashtag') {
      if (!columnValue) {
        toast({
          title: 'Hashtag required',
          description: 'Please enter a hashtag.',
          variant: 'destructive',
        });
        return;
      }
      // Remove # if user included it
      columnValue = columnValue.replace(/^#/, '');
      title = `#${columnValue}`;
    } else if (type === 'author') {
      if (!columnValue) {
        toast({
          title: 'Author required',
          description: 'Please enter an npub or hex pubkey.',
          variant: 'destructive',
        });
        return;
      }

      // Try to decode npub if provided
      if (columnValue.startsWith('npub1')) {
        try {
          const decoded = nip19.decode(columnValue);
          if (decoded.type === 'npub') {
            columnValue = decoded.data;
            title = `@${columnValue.slice(0, 8)}...`;
          } else {
            toast({
              title: 'Invalid npub',
              description: 'Please enter a valid npub or hex pubkey.',
              variant: 'destructive',
            });
            return;
          }
        } catch (error) {
          toast({
            title: 'Invalid npub',
            description: 'Could not decode npub. Please check the format.',
            variant: 'destructive',
          });
          return;
        }
      } else if (columnValue.startsWith('nprofile1')) {
        try {
          const decoded = nip19.decode(columnValue);
          if (decoded.type === 'nprofile') {
            columnValue = decoded.data.pubkey;
            title = `@${columnValue.slice(0, 8)}...`;
          } else {
            toast({
              title: 'Invalid nprofile',
              description: 'Please enter a valid nprofile, npub, or hex pubkey.',
              variant: 'destructive',
            });
            return;
          }
        } catch (error) {
          toast({
            title: 'Invalid nprofile',
            description: 'Could not decode nprofile. Please check the format.',
            variant: 'destructive',
          });
          return;
        }
      } else {
        // Assume hex pubkey
        if (!/^[0-9a-f]{64}$/i.test(columnValue)) {
          toast({
            title: 'Invalid pubkey',
            description: 'Please enter a valid hex pubkey or npub.',
            variant: 'destructive',
          });
          return;
        }
        title = `@${columnValue.slice(0, 8)}...`;
      }
    } else if (type === 'latest') {
      title = 'Latest';
    } else if (type === 'worldwide') {
      title = 'Worldwide';
    }

    const config: ColumnConfig = {
      id: `${type}-${Date.now()}`,
      type,
      title,
      value: columnValue || undefined,
    };

    onAdd(config);
    setOpen(false);
    setValue('');
    setType('worldwide');

    toast({
      title: 'Column added',
      description: `${title} column has been added to your deck.`,
    });
  };

  const selectUser = (pubkey: string, displayName: string) => {
    setValue(pubkey);
    setSearchOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary text-xs md:text-sm"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
          Add Column
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Column</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new column to filter Nostr events.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-foreground">Column Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ColumnType)}>
              <SelectTrigger className="bg-muted/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/50">
                <SelectItem value="latest">Latest (Following)</SelectItem>
                <SelectItem value="worldwide">Worldwide</SelectItem>
                <SelectItem value="hashtag">Hashtag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'hashtag' && (
            <div className="space-y-2">
              <Label htmlFor="hashtag" className="text-foreground">Hashtag</Label>
              <Input
                id="hashtag"
                placeholder="bitcoin"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-muted/30 border-border/50"
              />
              <p className="text-xs text-muted-foreground">
                Enter a hashtag without the # symbol
              </p>
            </div>
          )}

          {type === 'author' && (
            <div className="space-y-2">
              <Label htmlFor="author" className="text-foreground">Author</Label>
              <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <Input
                    id="author"
                    placeholder="Search by name or paste npub..."
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setSearchOpen(true);
                    }}
                    className="bg-muted/30 border-border/50"
                  />
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                  <Command>
                    <CommandInput placeholder="Search users..." value={value} onValueChange={setValue} />
                    <CommandList>
                      {isSearching ? (
                        <CommandEmpty>Searching...</CommandEmpty>
                      ) : searchResults.length === 0 && value.length >= 2 ? (
                        <CommandEmpty>
                          No users found. Paste npub/hex pubkey to continue.
                        </CommandEmpty>
                      ) : value.length < 2 ? (
                        <CommandEmpty>Type name or paste npub</CommandEmpty>
                      ) : (
                        <CommandGroup heading="Search Results">
                          {searchResults.map((user) => (
                            <CommandItem
                              key={user.pubkey}
                              value={user.pubkey}
                              onSelect={() => selectUser(user.pubkey, user.name || user.display_name || `${user.pubkey.slice(0, 8)}...`)}
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
                              <Check className={cn("h-4 w-4", value === user.pubkey ? "opacity-100" : "opacity-0")} />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Search by name or paste npub/hex pubkey
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleAdd}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Add Column
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
