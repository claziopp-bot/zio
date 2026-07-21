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

  function pickResult(item) {
    setSelected(item);
    setManualName(item.name);
    setResults([]);
    setQuery(item.name);
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
      address: selected?.address || null,
      place_url: selected?.link || null,
      lat: selected?.lat || null,
      lng: selected?.lng || null,
      added_by: myName,
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
        <div className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
          "{selected.name}" 선택됨 · 지도에 자동으로 핀이 표시돼요.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2 pt-1">
        {!selected && (
          <input
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="검색 결과가 없으면 직접 이름 입력"
            className="flex-1 min-w-[140px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
        )}
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
      </form>
    </div>
  );
}
