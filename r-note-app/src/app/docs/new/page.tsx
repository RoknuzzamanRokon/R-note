"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPost, isLoggedIn, bustCache, type CreatePostPayload } from "@/lib/api";
import { invalidatePosts } from "@/lib/postsStore";
import PostEditor from "../components/PostEditor";

export default function NewPostPage() {
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const handleSubmit = async (payload: CreatePostPayload) => {
    await createPost(payload);
    bustCache();
    invalidatePosts();
    router.push("/docs");
  };

  return (
    <PostEditor
      submitLabel="Publish"
      submittingLabel="Publishing…"
      submitIcon="send"
      onBack={() => router.push("/docs")}
      onSubmit={handleSubmit}
    />
  );
}
