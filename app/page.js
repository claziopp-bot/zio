"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CategoryTabs from "@/components/CategoryTabs";
import AddItemForm from "@/components/AddItemForm";
import ItemCard from "@/components/ItemCard";
import MapView from "@/components/MapView";

export default function Home() {
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState("전체");

  useEffect(() => {
    const saved = localStorage.getItem("travel-checklist-name");
    if (saved) setMyName(saved);
  }, []);

  function saveName(e) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    localStorage.setItem("travel-checklist-name", nameInput.trim());
    setMyName(nameInput.trim());
  }

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setItems(data);
  }

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("items-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = category === "전체" ? items : items.filter((i) => i.category === category);
  const doneCount = items.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">🧳 여행 어떡할려</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              가고 싶은 곳 생각날 때마다 바로바로 추가해요
            </p>
          </div>
          {items.length > 0 && (
            <div className="text-xs text-gray-400 text-right shrink-0">
              총 {items.length}곳 · 완료 {doneCount}곳
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {!myName ? (
          <form
            onSubmit={saveName}
            className="max-w-sm mx-auto mt-16 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3 text-center"
          >
            <div className="text-3xl">👋</div>
            <p className="text-sm text-gray-500">이름을 입력하고 체크리스트에 참여해보세요</p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="이름 입력"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-200"
              autoFocus
            />
            <button className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition">
              시작하기
            </button>
          </form>
        ) : (
          <div className="grid lg:grid-cols-[1fr_420px] gap-5 items-start">
            {/* 왼쪽: 추가 폼 + 리스트 */}
            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  <b className="text-gray-800">{myName}</b> 님으로 참여중
                </span>
              </div>

              <AddItemForm myName={myName} onAdded={fetchItems} />

              <CategoryTabs selected={category} onSelect={setCategory} />

              <div className="space-y-2 lg:hidden">
                {/* 모바일: 지도를 리스트 위쪽에 작게 보여줌 */}
                <MapView items={filtered} />
              </div>

              <div className="space-y-2">
                {filtered.length === 0 && (
                  <p className="text-center text-sm text-gray-400 py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    아직 추가된 장소가 없어요. 위에서 첫 장소를 추가해보세요!
                  </p>
                )}
                {filtered.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* 오른쪽: 지도 (데스크탑에서 항상 고정 노출) */}
            <div className="hidden lg:block sticky top-20 h-[calc(100vh-6rem)]">
              <MapView items={filtered} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
