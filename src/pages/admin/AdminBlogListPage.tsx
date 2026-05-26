import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  slug: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  updated_at: string;
  title_en: string | null;
}

export default function AdminBlogListPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: articles } = await supabase
      .from("blog_articles")
      .select("id, slug, status, is_featured, published_at, updated_at")
      .order("updated_at", { ascending: false });
    const ids = (articles ?? []).map((a) => a.id);
    const { data: trans } = await supabase
      .from("blog_article_translations")
      .select("article_id, title, language")
      .in("article_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const titleMap = new Map<string, string>();
    (trans ?? []).forEach((t: any) => {
      if (t.language === "en" || !titleMap.has(t.article_id)) titleMap.set(t.article_id, t.title);
    });
    setRows(
      (articles ?? []).map((a: any) => ({
        ...a,
        title_en: titleMap.get(a.id) ?? null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createNew() {
    const { data, error } = await supabase
      .from("blog_articles")
      .insert({ slug: `draft-${Date.now()}`, status: "draft" })
      .select("id")
      .single();
    if (error || !data) {
      alert(error?.message || "Failed to create");
      return;
    }
    window.location.href = `/admin/blog/${data.id}`;
  }

  async function remove(id: string) {
    if (!confirm("Delete this article and all translations?")) return;
    await supabase.from("blog_article_translations").delete().eq("article_id", id);
    await supabase.from("blog_article_tags").delete().eq("article_id", id);
    const { error } = await supabase.from("blog_articles").delete().eq("id", id);
    if (error) alert(error.message);
    load();
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Blog</h1>
          <Button onClick={createNew}>New article</Button>
        </div>
        {loading ? (
          <p className="opacity-60">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="opacity-60">No articles yet.</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase">
                <tr>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Featured</th>
                  <th className="text-left p-3">Updated</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.title_en || <span className="opacity-50">(untitled)</span>}</td>
                    <td className="p-3 font-mono text-xs opacity-70">{r.slug}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded ${r.status === "published" ? "bg-green-500/15 text-green-700" : "bg-yellow-500/15 text-yellow-700"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3">{r.is_featured ? "★" : ""}</td>
                    <td className="p-3 text-xs opacity-60">{new Date(r.updated_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right space-x-3">
                      <Link to={`/admin/blog/${r.id}`} className="text-xs underline">Edit</Link>
                      <Link to={`/blog/${r.slug}`} target="_blank" className="text-xs underline opacity-70">View</Link>
                      <button onClick={() => remove(r.id)} className="text-xs text-red-600 underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
