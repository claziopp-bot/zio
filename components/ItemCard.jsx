"use client";

import { useState } from "react";
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

export default function ItemCard({ item, tripId, days = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickDay, setPickDay] = useState(days[0]?.id || "");
  const [pickTime, setPickTime] = useState("");
  const [adding, setAdding] = useState(false);

  async function toggleChecked() {
    await supabase.from("items").update({ checked: !item.checked }).eq("id", item.id);
  }

  async function handleDelete() {
    if (!confirm(`"${item.name}" 삭제할까요?`)) return;
    await supabase.from("items").delete().eq("id", item.id);
  }

  async function addToTimetable() {
    if (!pickDay) {
      alert("먼저 타임테이블에서 '+ 하루 추가'로 날짜를 만들어주세요.");
      return;
    }
    setAdding(true);
    const { error } = await supabase.from("timetable_entries").insert({
      day_id: pickDay,
      trip_id: tripId,
      time: pickTime.trim() || null,
      title: item.name,
      item_id: item.id,
    });
    setAdding(false);
    if (error) {
      console.error(error);
      alert("타임테이블에 추가하는 중 오류가 발생했어요.");
      return;
    }
    setShowPicker(false);
    setPickTime("");
  }

  const mapLink = item.place_url
    ? item.place_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        item.address ? `${item.name} ${item.address}` : item.name
      )}`;

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
      {item.image_url && (
        <img
          src={item.image_url}
          alt=""
          className="w-14 h-14 rounded-lg object-cover shrink-0 bg-gray-100"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
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
            {item.place_url ? "네이버 지도에서 보기" : "지도에서 보기"}
          </a>
        </div>
        {item.memo && (
          <div className="mt-1.5 text-xs text-gray-500 bg-pink-50 border border-pink-100 rounded-lg px-2 py-1.5 whitespace-pre-wrap">
            📝 {item.memo}
          </div>
        )}

        {!showPicker ? (
          <button
            onClick={() => setShowPicker(true)}
            className="mt-1.5 text-[11px] text-pink-500 hover:underline"
          >
            🕐 타임테이블에 추가
          </button>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 bg-gray-50 rounded-lg p-2">
            <select
              value={pickDay}
              onChange={(e) => setPickDay(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-1.5 py-1"
            >
              {days.length === 0 && <option value="">날짜 없음</option>}
              {days.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.date || "날짜 미정"}
                </option>
              ))}
            </select>
            <input
              value={pickTime}
              onChange={(e) => setPickTime(e.target.value)}
              placeholder="09:00"
              className="w-14 text-xs border border-gray-200 rounded-lg px-1.5 py-1"
            />
            <button
              onClick={addToTimetable}
              disabled={adding}
              className="text-xs px-2 py-1 rounded-lg bg-pink-400 text-white disabled:opacity-50"
            >
              추가
            </button>
            <button
              onClick={() => setShowPicker(false)}
              className="text-xs px-2 py-1 rounded-lg text-gray-400"
            >
              취소
            </button>
          </div>
        )}
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
