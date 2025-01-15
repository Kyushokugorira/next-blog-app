"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { Category } from "@/app/_types/Category";
import Link from "next/link";

type RawApiCategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

const Page: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const requestUrl = "/api/categories";
      const res = await fetch(requestUrl, { method: "GET", cache: "no-store" });

      if (!res.ok) {
        setCategories(null);
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      const apiResBody = (await res.json()) as RawApiCategoryResponse[];
      setCategories(
        apiResBody.map((body) => ({ id: body.id, name: body.name }))
      );
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
          : `予期せぬエラーが発生しました ${error}`;
      console.error(errorMsg);
      setFetchErrorMsg(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`カテゴリ「${category.name}」を本当に削除しますか？`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const requestUrl = `/api/admin/categories/${category.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      await fetchCategories();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `カテゴリのDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (!categories) {
    return <div className="text-center text-red-500">{fetchErrorMsg}</div>;
  }

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 text-center text-3xl font-bold">カテゴリの管理</div>

      <div className="mb-6 text-right">
        <Link href="/admin/categories/new">
          <button
            className={twMerge(
              "rounded-full px-6 py-2 text-lg",
              "bg-green-500 text-white hover:bg-green-600",
              "transition-transform hover:scale-105",
              "shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
            )}
          >
            カテゴリの新規作成
          </button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center text-gray-500">
          （カテゴリは1個も作成されていません）
        </div>
      ) : (
        <div className="grid gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={twMerge(
                "rounded-lg border border-gray-300 bg-white p-4",
                "flex items-center justify-between shadow",
                "transition-colors duration-150 hover:bg-gray-50"
              )}
            >
              <div className="text-lg font-semibold text-gray-700">
                <Link href={`/admin/categories/${category.id}`}>
                  {category.name}
                </Link>
              </div>
              <div className="flex space-x-3">
                <Link href={`/admin/categories/${category.id}`}>
                  <button
                    type="button"
                    className={twMerge(
                      "rounded-md px-4 py-2",
                      "bg-blue-500 text-white hover:bg-blue-600",
                      "transition-transform hover:scale-105",
                      "focus:outline-none focus:ring-2 focus:ring-blue-300"
                    )}
                  >
                    編集
                  </button>
                </Link>
                <button
                  type="button"
                  className={twMerge(
                    "rounded-md px-4 py-2",
                    "bg-red-500 text-white hover:bg-red-600",
                    "transition-transform hover:scale-105",
                    "focus:outline-none focus:ring-2 focus:ring-red-300"
                  )}
                  onClick={() => handleDelete(category)}
                  disabled={isSubmitting}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
};

export default Page;
