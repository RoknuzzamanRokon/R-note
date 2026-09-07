"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getPostById,
  updatePost,
  isLoggedIn,
  bustCache,
  type Post,
  type CreatePostPayload,
} from "@/lib/api";
import { invalidatePosts } from "@/lib/postsStore";
import PostEditor from "../../components/PostEditor";

type FullPost = Post & { content: string };

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (!id) return;
    getPostById(id)
      .then((p) => setPost(p as FullPost))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSubmit = async (payload: CreatePostPayload) => {
    await updatePost(id, payload);
    bustCache(`post:${id}`);
    invalidatePosts();
    router.push(`/docs/${id}`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-24 animate-pulse space-y-md">
        <div className="h-4 bg-surface-variant rounded w-1/4" />
        <div className="h-8 bg-surface-variant rounded w-3/4" />
        <div className="mt-xl space-y-sm">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-3 bg-surface-variant rounded"
              style={{ width: `${65 + (i % 5) * 7}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto mt-24 flex items-center gap-sm p-lg rounded border border-tanstack-pink/30 bg-tanstack-pink/5 text-tanstack-pink">
        <span className="material-symbols-outlined text-[20px]">error</span>
        <span className="text-body-md">Failed to load document.</span>
      </div>
    );
  }

  return (
    <PostEditor
      initialValues={{
        title: post.title,
        excerpt: post.excerpt ?? "",
        author: post.author ?? "",
        categoryId: post.category?.id ?? "",
        status: post.status === "draft" ? "draft" : "published",
        featuredImage: post.featured_image ?? "",
        metaTitle: post.meta_title ?? "",
        metaDescription: post.meta_description ?? "",
        content: post.content ?? "",
      }}
      submitLabel="Save Changes"
      submittingLabel="Saving…"
      submitIcon="save"
      onBack={() => router.push(`/docs/${id}`)}
      onSubmit={handleSubmit}
    />
  );
}
