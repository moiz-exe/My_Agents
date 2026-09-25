import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";
import Image from "next/image";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  simulated: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-600",
};

export default async function PostsPage() {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Posts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every post the agent generates and publishes is recorded here, along with its Google Sheets
          sync status.
        </p>
      </div>

      {allPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No posts yet. Head to the Dashboard and click &quot;Run automation now&quot; to generate the
          first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {allPosts.map((post) => (
            <div key={post.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {post.imageUrl && (
                <div className="relative aspect-square w-full bg-slate-100">
                  <Image src={post.imageUrl} alt="Generated post" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-violet-100 px-2 py-1 font-medium capitalize text-violet-700">
                    {post.platform}
                  </span>
                  <span className={`rounded-full px-2 py-1 font-medium ${STATUS_STYLES[post.status] || STATUS_STYLES.draft}`}>
                    {post.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-900">{post.accountName}</p>
                <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">{post.content}</p>
                {post.link && (
                  <a href={post.link} target="_blank" className="truncate text-xs text-violet-600 hover:underline">
                    {post.link}
                  </a>
                )}
                {post.errorMessage && (
                  <p className="text-xs text-rose-600">⚠️ {post.errorMessage}</p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2 text-xs text-slate-500">
                  <span>{new Date(post.scheduledAt).toLocaleString()}</span>
                  <span>{post.sheetSynced ? "📄 Synced to Sheets" : "📄 Not synced"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
