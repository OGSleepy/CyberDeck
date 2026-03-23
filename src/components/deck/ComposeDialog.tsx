import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useToast } from '@/hooks/useToast';
import { Loader2, Send, Image as ImageIcon, X } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { Progress } from '@/components/ui/progress';

interface ComposeDialogProps {
  children?: React.ReactNode;
}

export function ComposeDialog({ children }: ComposeDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [uploadedMedia, setUploadedMedia] = useState<Array<{ url: string; tags: string[][] }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useCurrentUser();
  const { mutate: publish, isPending } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();

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
        description: 'Media has been uploaded and will be attached to your note.',
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
        title: 'Empty note',
        description: 'Please enter some content or attach media before posting.',
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

    publish(
      { 
        kind: 1, 
        content: finalContent,
        tags: imetaTags,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Note published',
            description: 'Your note has been published to the network.',
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
      <div className="flex items-center gap-1.5 md:gap-2">
        {children || (
          <Button size="sm" disabled className="bg-primary/50 cursor-not-allowed md:size-lg">
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            <span className="hidden md:inline">Post Note</span>
            <span className="md:hidden">Post</span>
          </Button>
        )}
        <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">Log in to post</span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 md:size-lg">
            <Send className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
            <span className="hidden md:inline">Post Note</span>
            <span className="md:hidden">Post</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-foreground">Compose Note</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share your thoughts with the Nostr network.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-[150px] resize-none bg-muted/30 border-border/50 focus:border-primary"
            disabled={isPending || isUploading}
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
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
