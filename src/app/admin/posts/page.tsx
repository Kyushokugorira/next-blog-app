"use client";
import { useState, useEffect, useCallback } from "react";
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import Link from "next/link";
import AdminPostSummary from "@/app/_components/AdminPostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";

type Category = {
  id: string;
  name: string;
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const requestUrl = `/api/posts`;
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("データの取得に失敗しました");
      }
      const postResponse: PostApiResponse[] = await response.json();

      // カテゴリ一覧を取得
      const allCategories = new Set<Category>();
      postResponse.forEach((post) =>
        post.categories.forEach((category) =>
          allCategories.add({
            id: category.category.id,
            name: category.category.name,
          })
        )
      );

      setCategories(Array.from(allCategories));

      setPosts(
        postResponse.map((rawPost) => ({
          id: rawPost.id,
          title: rawPost.title,
          content: rawPost.content,
          coverImage: {
            url: rawPost.coverImageURL,
            width: 1000,
            height: 1000,
          },
          createdAt: rawPost.createdAt,
          categories: rawPost.categories.map((category) => ({
            id: category.category.id,
            name: category.category.name,
          })),
        }))
      );
    } catch (e) {
      setFetchError(
        e instanceof Error ? e.message : "予期せぬエラーが発生しました"
      );
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const reloadAction = async () => {
    await fetchPosts();
  };

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCategory(event.target.value);
  };

  if (fetchError) {
    return <div className="text-center text-red-500">{fetchError}</div>;
  }

  if (!posts) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  const filteredPosts = selectedCategory
    ? posts.filter((post) =>
        post.categories.some((category) => category.id === selectedCategory)
      )
    : posts;

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 text-center text-3xl font-bold">投稿記事の管理</div>

      <div className="mb-4">
        <label htmlFor="category" className="mr-2 font-bold">
          カテゴリでフィルタ:
        </label>
        <select
          id="category"
          className="rounded-md border px-4 py-2"
          onChange={handleCategoryChange}
          value={selectedCategory || ""}
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 text-right">
        <Link href="/admin/posts/new">
          <button
            className={twMerge(
              "rounded-full px-6 py-2 text-lg",
              "bg-green-500 text-white hover:bg-green-600",
              "transition-transform hover:scale-105",
              "shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
            )}
          >
            新規作成
          </button>
        </Link>
      </div>
      <div className="space-y-4">
        {filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <AdminPostSummary
              key={post.id}
              post={post}
              reloadAction={reloadAction}
              setIsSubmitting={setIsSubmitting}
            />
          ))
        ) : (
          <div className="text-center text-gray-500">
            選択されたカテゴリには投稿がありません
          </div>
        )}
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon
              icon={faSpinner}
              className="mr-2 animate-spin text-gray-500"
            />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;
