"use client";

export const CATEGORIES = ["전체", "맛집", "카페", "체험", "기타"];

const EMOJI = {
  전체: "🗂️",
  맛집: "🍜",
  카페: "☕",
  체험: "🎡",
  기타: "📍",
};

export default function CategoryTabs({ selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border transition ${
            selected === cat
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
          }`}
        >
          {EMOJI[cat]} {cat}
        </button>
      ))}
    </div>
  );
}
