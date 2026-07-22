"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CATEGORY_OPTIONS = ["맛집", "카페", "체험", "기타"];
const CATEGORY_EMOJI = { 맛집: "🍜", 카페: "☕", 체험: "🎡", 기타: "📍" };

export default function AddItemForm({ myName, onAdded }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null); // 네이버 검색으로 고른 장소
  const [manualName, setManualName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState("맛집");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/naver-search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (err) {
      console.error(err);
      alert("검색 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSearching(false);
    }
  }

  async function pickResult(item) {
    setSelected(item);
    setManualName(item.name);
    setResults([]);
    setQuery(item.name);

    // 대표 사진 가져오기 (실패해도 무시하고 진행)
    try {
      const res = await fetch(`/api/naver-image?query=${encodeURIComponent(item.name)}`);
      const data = await res.json();
      setSelected((prev) => (prev ? { ...prev, image_url: data.image || null } : prev));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!myName.trim()) {
      alert("먼저 상단에 내 이름을 입력해주세요.");
      return;
    }
    const name = (selected?.name || manualName).trim();
    if (!name) {
      alert("장소 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("items").insert({
      name,
      category,
      address: selected?.address || manualAddress || null,
      place_url: selected?.link || null,
      lat: selected?.lat || null,
      lng: selected?.lng || null,
      added_by: myName,
      memo: memo.trim() || null,
      image_url: selected?.image_url || null,
    });
    setLoading(false);

    if (error) {
      console.error(error);
      alert("추가하는 중 오류가 발생했어요.");
      return;
    }

    // 폼 초기화
    setQuery("");
    setManualName("");
    setManualAddress("");
    setMemo("");
    setSelected(null);
    setResults([]);
    onAdded?.();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="장소 이름으로 검색 (예: 애월 카페)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
        />
        <button
          type="submit"
          disabled={searching}
          className="px-4 py-2 rounded-lg bg-gray-100 text-sm hover:bg-gray-200 disabled:opacity-50"
        >
          {searching ? "검색중..." : "검색"}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-hidden">
          {results.map((item, i) => (
            <li
              key={i}
              onClick={() => pickResult(item)}
              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-gray-400">
                {item.category} · {item.address}
              </div>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          {selected.image_url && (
            <img
              src={selected.image_url}
              alt=""
              className="w-8 h-8 rounded object-cover shrink-0"
            />
          )}
          <span>"{selected.name}" 선택됨 · 지도에 자동으로 핀이 표시돼요.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2 pt-1">
        {!selected && (
          <div className="space-y-1">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="검색 결과가 없으면 직접 이름 입력 (해외 장소도 OK)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <input
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="주소나 위치 설명 (선택, 해외 장소는 여기 적어주세요)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <p className="text-[11px] text-gray-400">
              💡 네이버 지도에 없는 해외 장소는 지도 핀은 안 찍혀도, 구글 지도 링크로 자동 연결돼요.
            </p>
          </div>
        )}

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="메모 (대표메뉴, 웨이팅 정보 등 자유롭게)"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black/10"
        />

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs border ${
                  category === c
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-500 border-gray-200"
                }`}
              >
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="ml-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "추가중..." : "+ 리스트에 추가"}
          </button>
        </div>
      </form>
    </div>
  );
}
