"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import Image from "next/image";

type RawApiCategoryResponse = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type PostApiResponse = {
  id: string;
  title: string;
  content: string;
  coverImageURL: string;
  createdAt: string;
  categories: {
    category: {
      id: string;
      name: string;
    };
  }[];
};

type SelectableCategory = {
  id: string;
  name: string;
  isSelect: boolean;
};

const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const { token } = useAuth(); // トークンの取得
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCoverImageURL, setNewCoverImageURL] = useState("");
  const [coverImageKey, setCoverImageKey] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [checkableCategories, setCheckableCategories] = useState<
    SelectableCategory[] | null
  >(null);

  const [rawApiPostResponse, setRawApiPostResponse] =
    useState<PostApiResponse | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setRawApiPostResponse(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setRawApiPostResponse(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as RawApiCategoryResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            isSelect: false,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    if (!rawApiPostResponse || !checkableCategories) return;

    setNewTitle(rawApiPostResponse.title);
    setNewContent(rawApiPostResponse.content);
    setNewCoverImageURL(rawApiPostResponse.coverImageURL);

    const selectedIds = new Set(
      rawApiPostResponse.categories.map((c) => c.category.id)
    );
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIds.has(category.id),
      }))
    );
    setIsInitialized(true);
  }, [isInitialized, rawApiPostResponse, checkableCategories]);

  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;

    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId
          ? { ...category, isSelect: !category.isSelect }
          : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };

  const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewContent(e.target.value);
  };

  const updateNewCoverImageURL = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCoverImageURL(e.target.value);
  };

  const handleFileUpload = async (file: File) => {
    const filePath = `cover-images/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("cover-images")
      .upload(filePath, file);

    if (error) {
      alert("アップロードに失敗しました");
      return;
    }
    setCoverImageKey(filePath);

    const { data: urlData } = supabase.storage
      .from("cover-images")
      .getPublicUrl(filePath);
    setCoverImageUrl(urlData.publicUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      window.alert("予期せぬ動作：トークンが取得できません。");
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: newTitle,
        content: newContent,
        coverImageURL: newCoverImageURL,
        coverImageKey: coverImageKey,
        coverImageUrl: coverImageUrl,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };

      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token, // ◀ 追加
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }

      setIsSubmitting(false);
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事の更新に失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-center text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4">
      <div className="mb-6 text-center text-3xl font-bold">
        投稿記事の編集・削除
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

      <form
        onSubmit={handleSubmit}
        className={twMerge("space-y-4", isSubmitting && "opacity-50")}
      >
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">
            タイトル
          </label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1 focus:ring-2 focus:ring-indigo-300"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="content" className="block font-bold">
            本文
          </label>
          <textarea
            id="content"
            name="content"
            className="h-48 w-full rounded-md border-2 px-2 py-1 focus:ring-2 focus:ring-indigo-300"
            value={newContent}
            onChange={updateNewContent}
            placeholder="本文を記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="coverImageURL" className="block font-bold">
            カバーイメージ (URL)
          </label>
          <input
            type="url"
            id="coverImageURL"
            name="coverImageURL"
            className="w-full rounded-md border-2 px-2 py-1 focus:ring-2 focus:ring-indigo-300"
            value={newCoverImageURL}
            onChange={updateNewCoverImageURL}
            placeholder="カバーイメージのURLを記入してください"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block font-bold">カバー画像アップロード</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 w-full rounded-md border-2 px-2 py-1"
          />
          {coverImageUrl && (
            <div className="mt-2">
              <Image
                src={coverImageUrl}
                alt="プレビュー画像"
                width={300}
                height={300}
                className="border border-gray-300"
              />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories!.length > 0 ? (
              checkableCategories!.map((c) => (
                <label key={c.id} className="flex items-center space-x-2">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className={twMerge(
              "rounded-full px-6 py-2 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "transition-transform hover:scale-105",
              "shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>

          <button
            type="button"
            className={twMerge(
              "rounded-full px-6 py-2 font-bold",
              "bg-red-500 text-white hover:bg-red-600",
              "transition-transform hover:scale-105",
              "shadow-md focus:outline-none focus:ring-2 focus:ring-red-300"
            )}
            // onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
