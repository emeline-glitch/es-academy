interface VideoPlayerProps {
  videoId: string;
  signedUrl?: string;
  className?: string;
}

export function VideoPlayer({ videoId, signedUrl, className = "" }: VideoPlayerProps) {
  const src = signedUrl || `https://iframe.mediadelivery.net/embed/${process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "LIBRARY_ID"}/${videoId}`;

  return (
    <div className={`relative aspect-video bg-gray-900 rounded-xl overflow-hidden ${className}`}>
      <iframe
        src={src}
        className="absolute inset-0 w-full h-full"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
