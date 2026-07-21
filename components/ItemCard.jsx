"use client";

import { supabase } from "@/lib/supabaseClient";

const CATEGORY_COLOR = {
  맛집: "bg-orange-100 text-orange-700",
  카페: "bg-amber-100 text-amber-700",
  체험: "bg-sky-100 text-sky-700",
  기타: "bg-gray-100 text-gray-600",
};

const CATEGORY_EMOJI = {
  맛집: "🍜",
  카페: "☕",
  체험: "🎡",
  기타: "📍",
};

export default function ItemCard({ item }) {
  async function toggleChecked() {
    await supabase.from("items").update({ checked: !item.checked }).eq("id", item.id);
  }

  async function handleDelete() {
    if (!confirm(`"${item.name}" 삭제할까요?`)) return;
    await supabase.from("items").delete().eq("id", item.id);
  }

  const mapLink =
    item.place_url ||
    `https://map.naver.com/p/search/${encodeURIComponent(item.name)}`;

  return (
    <div
      className={`flex items-start gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-3 transition hover:shadow-md ${
        item.checked ? "opacity-50" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={toggleChecked}
        className="mt-1 w-4 h-4 accent-black shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
              CATEGORY_COLOR[item.category] || CATEGORY_COLOR["기타"]
            }`}
          >
            {item.category}
          </span>
          <span
            className={`font-medium text-sm ${item.checked ? "line-through" : ""}`}
          >
            {CATEGORY_EMOJI[item.category] || "📍"} {item.name}
          </span>
        </div>
        {item.address && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">{item.address}</div>
        )}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
          <span>{item.added_by} 추가</span>
          <a
            href={mapLink}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >
            네이버 지도에서 보기
          </a>
        </div>
      </div>
      <button
        onClick={handleDelete}
        className="text-gray-300 hover:text-red-400 text-xs shrink-0"
      >
        삭제
      </button>
    </div>
  );
}
