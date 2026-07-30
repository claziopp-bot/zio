"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

function weekdayLabel(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${days[d.getDay()]}요일`;
}

function AddEntryRow({ dayId, tripId, onAdded }) {
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("timetable_entries").insert({
      day_id: dayId,
      trip_id: tripId,
      time: time.trim() || null,
      title: title.trim(),
    });
    setLoading(false);
    if (error) {
      console.error(error);
      alert("일정 추가 중 오류가 발생했어요.");
      return;
    }
    setTime("");
    setTitle("");
    onAdded?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-1.5 mt-2">
      <input
        value={time}
        onChange={(e) => setTime(e.target.value)}
        placeholder="09:00"
        className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="일정 입력 (예: 조식 먹기)"
        className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
      <button
        disabled={loading}
        className="px-2.5 py-1.5 rounded-lg bg-pink-100 text-pink-600 text-xs shrink-0 disabled:opacity-50"
      >
        추가
      </button>
    </form>
  );
}

export default function Timetable({ tripId }) {
  const [days, setDays] = useState([]);

  async function fetchAll() {
    const [{ data: daysData }, { data: entriesData }] = await Promise.all([
      supabase
        .from("timetable_days")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true }),
      supabase
        .from("timetable_entries")
        .select("*")
        .eq("trip_id", tripId)
        .order("time", { ascending: true }),
    ]);

    const merged = (daysData || []).map((day) => ({
      ...day,
      entries: (entriesData || []).filter((e) => e.day_id === day.id),
    }));
    setDays(merged);
  }

  useEffect(() => {
    if (!tripId) return;
    fetchAll();

    const channel = supabase
      .channel(`timetable-realtime-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timetable_days", filter: `trip_id=eq.${tripId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timetable_entries", filter: `trip_id=eq.${tripId}` },
        fetchAll
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function addDay() {
    const { error } = await supabase.from("timetable_days").insert({ trip_id: tripId, date: null });
    if (error) {
      console.error(error);
      alert("하루 추가 중 오류가 발생했어요.");
    }
  }

  async function updateDate(dayId, date) {
    await supabase.from("timetable_days").update({ date }).eq("id", dayId);
  }

  async function deleteDay(dayId) {
    if (!confirm("이 날짜의 타임테이블을 통째로 삭제할까요?")) return;
    await supabase.from("timetable_days").delete().eq("id", dayId);
  }

  async function deleteEntry(entryId) {
    await supabase.from("timetable_entries").delete().eq("id", entryId);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">🗓️ 타임테이블</span>
        <button
          onClick={addDay}
          className="text-xs px-3 py-1.5 rounded-full border border-pink-200 bg-pink-50 text-pink-600"
        >
          + 하루 추가
        </button>
      </div>

      {days.length === 0 && (
        <p className="text-center text-xs text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
          아직 만들어진 날짜가 없어요.
          <br />
          "+ 하루 추가"로 첫 날짜를 만들어보세요.
        </p>
      )}

      {days.map((day) => (
        <div
          key={day.id}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              type="date"
              value={day.date || ""}
              onChange={(e) => updateDate(day.id, e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs"
            />
            {day.date && (
              <span className="text-xs text-gray-400 shrink-0">{weekdayLabel(day.date)}</span>
            )}
            <button
              onClick={() => deleteDay(day.id)}
              className="text-gray-300 hover:text-red-400 text-xs shrink-0"
            >
              삭제
            </button>
          </div>

          {day.entries.length > 0 && (
            <div className="divide-y divide-gray-100">
              {day.entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs text-gray-400 w-12 shrink-0">{entry.time || "--:--"}</span>
                  <span className="text-xs flex-1 min-w-0 truncate">{entry.title}</span>
                  {entry.item_id && (
                    <span className="text-[10px] bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded shrink-0">
                      📍리스트
                    </span>
                  )}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-gray-300 hover:text-red-400 text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <AddEntryRow dayId={day.id} tripId={tripId} onAdded={fetchAll} />
        </div>
      ))}
    </div>
  );
}
