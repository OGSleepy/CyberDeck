import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Loader2, Send, Image as ImageIcon, X, MessageSquare } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { Progress } from '@/components/ui/progress';
import type { NostrEvent } from '@nostrify/nostrify';
import { useAuthor } from '@/hooks/useAuthor';

interface ReplyDialogProps {
  event: NostrEvent;
  children?: React.ReactNode;
  className?: string;
}

export function ReplyDialog({ event, children, className }: ReplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ url: string; tags: string[][] }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const { user } = useCurrentUser();
  const { mutate: publish, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  const author = useAuthor(event.pubkey);

  const displayName = author.data?.metadata?.name || 
    author.data?.metadata?.display_name || 
    `${event.pubkey.slice(0, 8)}...${event.pubkey.slice(-4)}`;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image or video file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tags = await uploadFile(file);
      const url = tags[0][1]; // First tag contains the URL

      setUploadedMedia([...uploadedMedia, { url, tags }]);

      toast({
        title: 'Upload successful',
        description: 'Media has been uploaded and will be attached to your reply.',
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const removeMedia = (url: string) => {
    setUploadedMedia(uploadedMedia.filter(m => m.url !== url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && uploadedMedia.length === 0) {
      toast({
        title: 'Empty reply',
        description: 'Please enter some content or attach media before replying.',
        variant: 'destructive',
      });
      return;
    }

    // Build content with media URLs
    let finalContent = content.trim();
    if (uploadedMedia.length > 0) {
      const mediaUrls = uploadedMedia.map(m => m.url).join('\n');
      finalContent = finalContent ? `${finalContent}\n\n${mediaUrls}` : mediaUrls;
    }

    // Build imeta tags for attached media
    const imetaTags = uploadedMedia.flatMap(m => m.tags);

    // Build reply tags
    // NIP-10: Use 'e' tag for the event being replied to, and 'p' tag for the author
    const replyTags: string[][] = [
      ['e', event.id, '', 'reply'], // Mark as reply
      ['p', event.pubkey], // Mention the author
    ];

    // If the original event has 'e' tags, include the root
    const originalETags = event.tags.filter(([name]) => name === 'e');
    if (originalETags.length > 0) {
      // The first 'e' tag in the original is likely the root
      const rootTag = originalETags[0];
      replyTags.unshift(['e', rootTag[1], '', 'root']);
    } else {
      // If no existing 'e' tags, this event becomes the root
      replyTags[0][3] = 'root';
    }

    // Add all 'p' tags from the original event
    const originalPTags = event.tags.filter(([name]) => name === 'p');
    originalPTags.forEach(tag => {
      // Don't duplicate the author's p tag
      if (tag[1] !== event.pubkey) {
        replyTags.push(tag);
      }
    });

    publish(
      {
        kind: 1,
        content: finalContent,
        tags: [...replyTags, ...imetaTags],
      },
      {
        onSuccess: () => {
          toast({
            title: 'Reply published',
            description: 'Your reply has been published to the network.',
          });
          setContent('');
          setUploadedMedia([]);
          setOpen(false);
        },
        onError: (error) => {
          toast({
            title: 'Failed to publish',
            description: error.message,
            variant: 'destructive',
          });
        },
      }
    );
  };

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={className}
        disabled
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    );
  }

  const replyForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-sm">
        <p className="text-muted-foreground text-xs mb-1">Replying to @{displayName}</p>
        <p className="line-clamp-2">{event.content}</p>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        className="min-h-[120px] resize-none bg-muted/30 border-border/50 focus:border-primary"
        disabled={isPending || isUploading}
        autoFocus
      />

      {/* Media Previews */}
      {uploadedMedia.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {uploadedMedia.map((media, index) => (
            <div key={index} className="relative group">
              <img
                src={media.url}
                alt="Upload preview"
                className="w-full h-32 object-cover rounded-lg border border-border/50"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(media.url)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Uploading media...</span>
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
          <Progress value={undefined} className="h-1" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploading}
            className="border-border/50 hover:border-primary/50 hover:text-primary"
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Add Media</span>
          </Button>
          <span className="text-xs text-muted-foreground">
            {content.length} chars
            {uploadedMedia.length > 0 && `, ${uploadedMedia.length} media`}
          </span>
        </div>
        <Button
          type="submit"
          disabled={isPending || isUploading || (!content.trim() && uploadedMedia.length === 0)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Replying...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Reply
            </>
          )}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {children || (
            <Button
              variant="ghost"
              size="sm"
              className={className}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Reply</DrawerTitle>
            <DrawerDescription>
              Share your thoughts on this note.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto">
            {replyForm}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="sm"
            className={className}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">Reply</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your thoughts on this note.
          </DialogDescription>
        </DialogHeader>
        {replyForm}
      </DialogContent>
    </Dialog>
  );
}
