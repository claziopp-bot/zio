"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

export default function MapView({ items }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const pinned = items.filter((i) => i.lat && i.lng);

  function drawMarkers() {
    if (!window.naver || !window.naver.maps || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(37.5665, 126.978), // 기본: 서울
        zoom: 12,
      });
    }

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (pinned.length === 0) return;

    const bounds = new window.naver.maps.LatLngBounds();

    pinned.forEach((item) => {
      const position = new window.naver.maps.LatLng(item.lat, item.lng);
      const marker = new window.naver.maps.Marker({
        position,
        map: mapInstance.current,
        title: item.name,
      });

      const info = new window.naver.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;">${item.name}</div>`,
      });
      window.naver.maps.Event.addListener(marker, "click", () => {
        info.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    mapInstance.current.fitBounds(bounds);
  }

  useEffect(() => {
    drawMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white h-full flex flex-col">
      <Script
        strategy="afterInteractive"
        src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
        onLoad={drawMarkers}
      />
      <div ref={mapRef} className="w-full flex-1 min-h-[280px]" />
      <div className="text-center text-xs text-gray-400 py-2 border-t border-gray-100 bg-gray-50">
        {pinned.length === 0
          ? "핀이 찍힌 장소가 아직 없어요. 검색해서 추가하면 여기 표시돼요."
          : `📍 지도에 ${pinned.length}곳 표시중`}
      </div>
    </div>
  );
}
