/**
 * Every video embed in the library goes through this one component, so a
 * change to privacy mode, aspect ratio or lazy loading is a one-file change.
 * 21 posts use it.
 */
export function YouTube({ id, title = "Video" }: { id: string; title?: string }) {
  return (
    <div className="my-8 overflow-hidden rounded-xl border border-hairline bg-card">
      <div className="relative aspect-video">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={title}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
export default YouTube;
