"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatRange(start, end) {
  if (!start && !end) return null;
  const fmt = (d) => {
    const [, m, day] = d.split("-");
    return `${Number(m)}/${Number(day)}`;
  };
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  return fmt(start || end);
}

export default function Home() {
  const router = useRouter();
  const [myName, setMyName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);

  const [showNewTrip, setShowNewTrip] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("travel-checklist-name");
    if (saved) setMyName(saved);
  }, []);

  useEffect(() => {
    if (myName) fetchTrips(myName);
  }, [myName]);

  async function fetchTrips(name) {
    setLoadingTrips(true);
    const { data, error } = await supabase
      .from("trip_members")
      .select("trips(id, name, start_date, end_date, created_at)")
      .eq("member_name", name);

    if (!error && data) {
      const list = data
        .map((row) => row.trips)
        .filter(Boolean)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTrips(list);
    }
    setLoadingTrips(false);
  }

  function startWithName(e) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    localStorage.setItem("travel-checklist-name", nameInput.trim());
    setMyName(nameInput.trim());
  }

  async function handleCreateTrip(e) {
    e.preventDefault();
    if (!newTripName.trim()) return;
    setCreating(true);

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        name: newTripName.trim(),
        start_date: newStart || null,
        end_date: newEnd || null,
      })
      .select()
      .single();

    if (error) {
      setCreating(false);
      alert("여행 만들기 중 오류가 발생했어요.");
      return;
    }

    await supabase.from("trip_members").insert({ trip_id: trip.id, member_name: myName });

    setCreating(false);
    router.push(`/trip/${trip.id}`);
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="text-center">
          <h1
            className="text-2xl tracking-wide"
            style={{ fontFamily: "'Black Han Sans', sans-serif" }}
          >
            🧳 여행 어떡할려
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            가고 싶은 곳 생각날 때마다 바로바로 추가해요
          </p>
        </div>

        {!myName ? (
          <form
            onSubmit={startWithName}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3 text-center"
          >
            <div className="text-3xl">👋</div>
            <p className="text-sm text-gray-500">이름을 입력하고 내 여행 목록을 확인하세요</p>
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
          <>
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-gray-500">
                👋 <b className="text-gray-800">{myName}</b> 님의 여행
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem("travel-checklist-name");
                  setMyName("");
                  setTrips([]);
                }}
                className="text-xs text-gray-400 underline"
              >
                이름 바꾸기
              </button>
            </div>

            <div className="space-y-2">
              {loadingTrips && (
                <p className="text-center text-sm text-gray-400 py-6">불러오는 중...</p>
              )}

              {!loadingTrips && trips.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                  아직 참여 중인 여행이 없어요.
                  <br />
                  새 여행을 만들거나, 친구에게 받은 링크로 들어가보세요.
                </p>
              )}

              {trips.map((trip) => {
                const range = formatRange(trip.start_date, trip.end_date);
                return (
                  <button
                    key={trip.id}
                    onClick={() => router.push(`/trip/${trip.id}`)}
                    className="w-full text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">✈️ {trip.name}</p>
                      {range && <p className="text-xs text-gray-400 mt-0.5">{range}</p>}
                    </div>
                    <span className="text-gray-300">›</span>
                  </button>
                );
              })}
            </div>

            {!showNewTrip ? (
              <button
                onClick={() => setShowNewTrip(true)}
                className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
              >
                + 새 여행 만들기
              </button>
            ) : (
              <form
                onSubmit={handleCreateTrip}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-2"
              >
                <input
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  placeholder="여행 이름 (예: 부산 여행)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  autoFocus
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs"
                  />
                  <input
                    type="date"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewTrip(false)}
                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? "만드는 중..." : "만들기"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
