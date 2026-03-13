import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

// Extract video ID from YouTube URL
const YOUTUBE_VIDEO_ID = '_AAdae7diOU';

export function BackgroundMusic() {
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay compliance
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleMute = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Send postMessage to YouTube iframe to toggle mute
    if (isMuted) {
      iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
    } else {
      iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
    }
    
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Hidden YouTube iframe for background music */}
      <div className="fixed -left-[9999px] -top-[9999px] w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <iframe
          ref={iframeRef}
          id="youtube-background-player"
          width="1"
          height="1"
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&mute=1&controls=0&enablejsapi=1&origin=${window.location.origin}`}
          title="Background Music"
          allow="autoplay; encrypted-media"
          style={{ border: 'none', opacity: 0 }}
        />
      </div>

      {/* Floating music control button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMute}
          className="h-10 w-10 rounded-full border-primary/30 bg-card/90 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 shadow-lg shadow-primary/20 transition-all"
          title={isMuted ? 'Unmute background music' : 'Mute background music'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-primary animate-pulse" />
          )}
        </Button>
      </div>
    </>
  );
}


