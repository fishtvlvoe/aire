"use client";

import { useEffect, useRef, useState } from "react";
import { geocodeAddress, fetchAmenities, MapGeocodingError } from "@/lib/map-api";
import type { Amenity } from "@/lib/map-api";

interface Props {
  address: string;
  onMapReady?: (imageUrl: string) => void;
}

type State =
  | { status: "loading" }
  | { status: "ready"; lat: number; lng: number; amenities: Amenity[] }
  | { status: "error"; message: string };

export function DossierSurroundingMap({ address, onMapReady }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  useEffect(() => {
    if (!address) {
      setState({ status: "error", message: "地圖載入失敗，請確認地址" });
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { lat, lng } = await geocodeAddress(address);
        if (cancelled) return;
        const amenities = await fetchAmenities(lat, lng, 1000).catch(() => [] as Amenity[]);
        if (cancelled) return;
        setState({ status: "ready", lat, lng, amenities });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof MapGeocodingError ? err.message : "地圖載入失敗，請確認地址";
        setState({ status: "error", message: `地圖載入失敗，請確認地址` });
        void msg;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address]);

  useEffect(() => {
    if (state.status !== "ready") return;
    if (!mapRef.current) return;
    if (typeof window === "undefined") return;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;
      if (leafletRef.current) {
        leafletRef.current.remove();
      }
      const map = L.map(mapRef.current).setView([state.lat, state.lng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);
      state.amenities.forEach((a) => {
        L.marker([a.lat, a.lng]).addTo(map).bindPopup(`${a.type}: ${a.name}`);
      });
      leafletRef.current = map;
      onMapReady?.("");
    })();

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, [state, onMapReady]);

  if (state.status === "error") {
    return <div data-testid="surrounding-map-error">{state.message}</div>;
  }

  if (state.status === "loading") {
    return <div data-testid="surrounding-map-loading">地圖載入中…</div>;
  }

  return <div ref={mapRef} data-testid="surrounding-map-container" style={{ height: "400px", width: "100%" }} />;
}
