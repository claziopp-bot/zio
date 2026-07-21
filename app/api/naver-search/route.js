import { NextResponse } from "next/server";

// 네이버 지역 검색 오픈API를 서버에서 대신 호출해주는 프록시입니다.
// (브라우저에서 직접 호출하면 CORS 때문에 막히고, Client Secret도 노출되기 때문)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "검색어(query)가 필요합니다." }, { status: 400 });
  }

  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "서버에 NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
    query
  )}&display=5&sort=random`;

  const res = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "네이버 검색 API 호출 실패", detail: text }, { status: res.status });
  }

  const data = await res.json();

  // HTML 태그(<b> 등) 제거 + 좌표 변환(mapx/mapy -> 위경도)해서 정리된 형태로 내려줍니다.
  const items = (data.items || []).map((item) => ({
    name: item.title.replace(/<[^>]*>?/gm, ""),
    category: item.category,
    address: item.roadAddress || item.address,
    link: item.link,
    lng: Number(item.mapx) / 10000000,
    lat: Number(item.mapy) / 10000000,
  }));

  return NextResponse.json({ items });
}
