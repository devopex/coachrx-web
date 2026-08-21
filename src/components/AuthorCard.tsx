import { getAuthor } from "@/data/authors";

export function AuthorCard({ author }: { author: string }) {
  const a = getAuthor(author);
  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5">
      <div className="relative h-[52px] w-[52px] flex-none overflow-hidden rounded-full border border-white/10 bg-card-hi">
        {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[15px] font-semibold text-ink">{a.name}</span>
        {a.bio ? <span className="text-[13.5px] leading-relaxed text-white/[0.6]">{a.bio}</span> : null}
      </div>
    </div>
  );
}
