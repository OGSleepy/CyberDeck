import { useState, useEffect } from 'react';
import { DeckColumn } from './DeckColumn';
import { AddColumnDialog } from './AddColumnDialog';
import { CustomColumnDialog } from './CustomColumnDialog';
import { ComposeDialog } from './ComposeDialog';
import type { ColumnConfig, CustomColumnConfig } from '@/hooks/useDeckColumn';
import { useColumnSync } from '@/hooks/useColumnSync';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Settings, Zap, CloudUpload, CloudDownload } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { WalletModal } from '@/components/WalletModal';
import { useToast } from '@/hooks/useToast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { RelayListManager } from '@/components/RelayListManager';
import { BackgroundMusic } from '@/components/BackgroundMusic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_COLUMNS: Array<ColumnConfig | CustomColumnConfig> = [
  { id: 'worldwide-1', type: 'worldwide', title: 'Worldwide' },
  { id: 'hashtag-nostr', type: 'hashtag', title: '#nostr', value: 'nostr' },
  { id: 'hashtag-bitcoin', type: 'hashtag', title: '#bitcoin', value: 'bitcoin' },
];

export function NostrDeck() {
  const { user } = useCurrentUser();
  const { remoteColumns, isLoading: isSyncLoading, saveColumns, isSaving } = useColumnSync();
  const { toast } = useToast();
  const [hasSyncedFromRemote, setHasSyncedFromRemote] = useState(false);
  
  const [columns, setColumns] = useState<Array<ColumnConfig | CustomColumnConfig>>(() => {
    const saved = localStorage.getItem('cyberdeck:columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const { theme, setTheme } = useTheme();

  // Sync from remote when user logs in (only once per session)
  useEffect(() => {
    if (user && remoteColumns && !hasSyncedFromRemote && !isSyncLoading) {
      console.log('[NostrDeck] Syncing columns from relays...');
      setColumns(remoteColumns);
      localStorage.setItem('cyberdeck:columns', JSON.stringify(remoteColumns));
      setHasSyncedFromRemote(true);
      toast({
        title: 'Columns synced',
        description: `Loaded ${remoteColumns.length} columns from relays.`,
      });
    }
  }, [user, remoteColumns, hasSyncedFromRemote, isSyncLoading, toast]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!user) {
      setHasSyncedFromRemote(false);
    }
  }, [user]);

  // Save columns to localStorage when they change
  useEffect(() => {
    localStorage.setItem('cyberdeck:columns', JSON.stringify(columns));
  }, [columns]);

  // Auto-save to relays when columns change (debounced)
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      console.log('[NostrDeck] Auto-saving columns to relays...');
      saveColumns(columns).catch(error => {
        console.error('[NostrDeck] Failed to save columns:', error);
      });
    }, 2000); // Debounce by 2 seconds

    return () => clearTimeout(timer);
  }, [columns, user, saveColumns]);

  const handleAddColumn = (config: ColumnConfig | CustomColumnConfig) => {
    setColumns((prev) => [...prev, config]);
  };

  const handleRemoveColumn = (id: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  const handleUpdateColumn = (config: ColumnConfig | CustomColumnConfig) => {
    setColumns((prev) => prev.map((col) => col.id === config.id ? config : col));
  };

  const handleManualSave = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to save columns to relays.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveColumns(columns);
      toast({
        title: 'Saved to relays',
        description: `${columns.length} columns saved successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save columns',
        variant: 'destructive',
      });
    }
  };

  const handleManualSync = () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to sync columns from relays.',
        variant: 'destructive',
      });
      return;
    }

    if (remoteColumns) {
      setColumns(remoteColumns);
      localStorage.setItem('cyberdeck:columns', JSON.stringify(remoteColumns));
      toast({
        title: 'Synced from relays',
        description: `Loaded ${remoteColumns.length} columns.`,
      });
    } else {
      toast({
        title: 'No remote columns',
        description: 'No column configuration found on relays.',
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - sticky on desktop, static on mobile */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm md:sticky top-0 z-10 shadow-lg shadow-primary/5">
        {/* Desktop Header */}
        <div className="hidden md:flex px-4 py-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2 select-none">
              <span className="text-3xl animate-pulse">⚡</span>
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent hover:from-primary hover:via-primary/80 hover:to-primary/40 transition-all">
                CyberDeck
              </span>
            </h1>
            <span className="text-xs text-muted-foreground font-mono border border-border/30 px-2 py-0.5 rounded bg-muted/20">
              v1.0.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ComposeDialog />
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowWallet(true)}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary"
            >
              <Zap className="h-4 w-4 mr-2" />
              Wallet
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-border/50 hover:bg-muted/50"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover border-border/50">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowSettings(true)}>
                  Manage Relays
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  Toggle Theme ({theme})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">Column Sync</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleManualSave} disabled={!user || isSaving}>
                  <CloudUpload className="h-4 w-4 mr-2" />
                  Save to Relays {isSaving && '...'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleManualSync} disabled={!user || isSyncLoading}>
                  <CloudDownload className="h-4 w-4 mr-2" />
                  Load from Relays
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                    Vibed with Shakespeare
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-2">
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>

        {/* Mobile Header - Compact */}
        <div className="md:hidden px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold text-primary tracking-tight flex items-center gap-1.5 select-none">
              <span className="text-xl animate-pulse">⚡</span>
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                CyberDeck
              </span>
            </h1>
            
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-border/50 hover:bg-muted/50"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border/50">
                  <DropdownMenuLabel>Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowSettings(true)}>
                    Manage Relays
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    Toggle Theme ({theme})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Column Sync</DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleManualSave} disabled={!user || isSaving}>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Save to Relays {isSaving && '...'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleManualSync} disabled={!user || isSyncLoading}>
                    <CloudDownload className="h-4 w-4 mr-2" />
                    Load from Relays
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                      Vibed with Shakespeare
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <LoginArea className="max-w-40" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ComposeDialog>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
                Post
              </Button>
            </ComposeDialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWallet(true)}
              className="border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:text-primary flex-1"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Deck Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex gap-2 md:gap-3 p-2 md:p-3" style={{ minWidth: 'max-content' }}>
          {columns.map((column) => (
            <div key={column.id} className="w-[300px] md:w-[380px] h-full flex-shrink-0">
              <DeckColumn
                config={column}
                onRemove={() => handleRemoveColumn(column.id)}
                onUpdate={handleUpdateColumn}
                onAddColumn={handleAddColumn}
              />
            </div>
          ))}

          {/* Add Column Button */}
          <div className="w-[300px] md:w-[380px] h-full flex-shrink-0 flex items-center justify-center">
            <div className="h-full w-full border-2 border-dashed border-border/30 rounded-lg flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="text-4xl md:text-6xl text-muted-foreground/30 group-hover:text-primary/40 transition-colors">+</div>
                <div className="flex flex-col gap-1.5 md:gap-2">
                  <AddColumnDialog onAdd={handleAddColumn} />
                  <CustomColumnDialog onAdd={handleAddColumn} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground">Relay Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manage your Nostr relay connections. Changes are synced across devices when logged in.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RelayListManager />
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Modal */}
      <WalletModal open={showWallet} onOpenChange={setShowWallet} />

      {/* Background Music */}
      <BackgroundMusic />
    </div>
  );
}
