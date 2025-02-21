import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@prisma/client";
import { supabase } from "@/utils/supabase"; // ◀ 追加

type RouteParams = {
  params: {
    id: string;
  };
};

type RequestBody = {
  name: string;
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  // JWTトークンの検証・認証 (失敗したら 401 Unauthorized を返す)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const id = routeParams.params.id;
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 }
    );
  }
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  // JWTトークンの検証・認証 (失敗したら 401 Unauthorized を返す)
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const id = routeParams.params.id;
    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 }
    );
  }
};
