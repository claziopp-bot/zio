"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CategoryTabs from "@/components/CategoryTabs";
import AddItemForm from "@/components/AddItemForm";
import ItemCard from "@/components/ItemCard";
import MapView from "@/components/MapView";
import Timetable from "@/components/Timetable";

export default function TripPage() {
  const { id: tripId } = useParams();
  const router = useRouter();

  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("전체");
  const [copied, setCopied] = useState(false);
  const [timetableDays, setTimetableDays] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("travel-checklist-name");
    if (saved) setMyName(saved);
  }, []);

  // 여행 정보 불러오기
  useEffect(() => {
    async function fetchTrip() {
      const { data } = await supabase.from("trips").select("*").eq("id", tripId).single();
      setTrip(data);
    }
    if (tripId) fetchTrip();
  }, [tripId]);

  // 이름이 확정되면 이 여행의 멤버로 등록 (이미 있으면 무시)
  useEffect(() => {
    async function joinTrip() {
      if (!myName || !tripId) return;
      await supabase
        .from("trip_members")
        .upsert({ trip_id: tripId, member_name: myName }, { onConflict: "trip_id,member_name" });
    }
    joinTrip();
  }, [myName, tripId]);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (!error) setItems(data);
  }

  useEffect(() => {
    if (!tripId) return;
    fetchItems();

    const channel = supabase
      .channel(`items-realtime-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `trip_id=eq.${tripId}` },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  async function fetchTimetableDays() {
    const { data } = await supabase
      .from("timetable_days")
      .select("id, date")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true });
    setTimetableDays(data || []);
  }

  useEffect(() => {
    if (!tripId) return;
    fetchTimetableDays();

    const channel = supabase
      .channel(`timetable-days-list-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "timetable_days", filter: `trip_id=eq.${tripId}` },
        fetchTimetableDays
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  function saveName(e) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    localStorage.setItem("travel-checklist-name", nameInput.trim());
    setMyName(nameInput.trim());
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const filtered = category === "전체" ? items : items.filter((i) => i.category === category);
  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <button
              onClick={() => router.push("/")}
              className="text-xs text-gray-400 hover:text-pink-400 mb-1"
            >
              ← 내 여행 목록
            </button>
            <h1
              className="text-xl tracking-wide truncate"
              style={{ fontFamily: "'Black Han Sans', sans-serif" }}
            >
              ✈️ {trip?.name || "여행"}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {items.length > 0 && (
              <span className="text-xs text-gray-400 hidden sm:inline">
                총 {items.length}곳 · 완료 {doneCount}곳
              </span>
            )}
            <button
              onClick={copyLink}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white whitespace-nowrap"
            >
              {copied ? "복사됨!" : "🔗 링크 공유"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!myName ? (
          <form
            onSubmit={saveName}
            className="max-w-sm mx-auto mt-16 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3 text-center"
          >
            <div className="text-3xl">👋</div>
            <p className="text-sm text-gray-500">
              "{trip?.name || "여행"}"에 참여하려면 이름을 입력해주세요
            </p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="이름 입력"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-200"
              autoFocus
            />
            <button className="w-full py-2.5 rounded-lg bg-pink-400 text-white text-sm font-medium hover:bg-pink-500 transition">
              참여하기
            </button>
          </form>
        ) : (
          <div className="grid lg:grid-cols-[300px_1fr_380px] gap-5 items-start">
            <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
              <Timetable tripId={tripId} />
            </div>

            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  <b className="text-gray-800">{myName}</b> 님으로 참여중
                </span>
              </div>

              <AddItemForm myName={myName} tripId={tripId} onAdded={fetchItems} />

              <CategoryTabs selected={category} onSelect={setCategory} />

              <div className="space-y-2 lg:hidden">
                <MapView items={filtered} />
              </div>

              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    아직 추가된 장소가 없어요. 위에서 첫 장소를 추가해보세요!
                  </p>
                )}
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} tripId={tripId} days={timetableDays} />
                ))}
              </div>
            </div>

            <div className="hidden lg:block sticky top-20 h-[calc(100vh-6rem)]">
              <MapView items={filtered} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
