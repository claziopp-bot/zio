import { NextResponse } from "next/server";

// 장소 이름으로 대표 사진 한 장을 가져오는 프록시입니다.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "검색어(query)가 필요합니다." }, { status: 400 });
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "서버 환경변수 누락" }, { status: 500 });
  }

  const url = `https://openapi.naver.com/v1/search/image?query=${encodeURIComponent(
    query
  )}&display=1&sort=sim`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ image: null });
  }

  const data = await res.json();
  const first = data.items?.[0];

  return NextResponse.json({ image: first?.thumbnail || first?.link || null });
}
