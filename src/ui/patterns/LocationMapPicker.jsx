import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { getCityMapCenter } from "../../constants/cityMapCenters.js";
import { isNativeCapacitorShell, requestNativePermission } from "../../utils/nativePermissions.js";

const DEFAULT_ZOOM = 15;
const MIN_ZOOM = 11;
const MAX_ZOOM = 18;
const TILE_SIZE = 256;
const DRAG_THRESHOLD_PX = 6;

function roundCoord(n) {
  return Math.round(n * 1e6) / 1e6;
}

function latLngToWorldPx(lat, lng, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function worldPxToLatLng(x, y, zoom) {
  const scale = TILE_SIZE * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / scale)));
  const lat = (latRad * 180) / Math.PI;
  return { lat: roundCoord(lat), lng: roundCoord(lng) };
}

function tileUrl(x, y, z) {
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

function buildTileLayout(centerLat, centerLng, zoom, viewW, viewH) {
  const center = latLngToWorldPx(centerLat, centerLng, zoom);
  const originX = center.x - viewW / 2;
  const originY = center.y - viewH / 2;
  const x0 = Math.floor(originX / TILE_SIZE);
  const y0 = Math.floor(originY / TILE_SIZE);
  const x1 = Math.floor((originX + viewW) / TILE_SIZE);
  const y1 = Math.floor((originY + viewH) / TILE_SIZE);
  /** @type {{ key: string, src: string, left: number, top: number }[]} */
  const tiles = [];
  for (let ty = y0; ty <= y1; ty += 1) {
    for (let tx = x0; tx <= x1; tx += 1) {
      tiles.push({
        key: `${zoom}-${tx}-${ty}`,
        src: tileUrl(tx, ty, zoom),
        left: tx * TILE_SIZE - originX,
        top: ty * TILE_SIZE - originY,
      });
    }
  }
  return { tiles, originX, originY };
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=en`,
      { headers: { Accept: "application/json" } },
    );
    const data = await res.json();
    const a = data.address || {};

    const micro =
      a.neighbourhood ||
      a.suburb ||
      a.village ||
      a.hamlet ||
      a.isolated_dwelling ||
      a.quarter;
    const road = a.road || a.pedestrian || a.footway || a.path || a.residential;
    const town = a.city_district || a.city || a.town || a.municipality || a.county;
    const state = a.state_district || a.state;

    const parts = [micro, road, town, state].filter(Boolean);

    return parts.length > 0
      ? parts.slice(0, 4).join(", ")
      : data.display_name?.split(",").slice(0, 3).join(", ") || `${lat}, ${lng}`;
  } catch {
    return `${lat}, ${lng}`;
  }
}

/**
 * Interactive map pin picker — pan, zoom, tap-to-pin, search, GPS.
 * @param {{
 *   latitude?: number | null,
 *   longitude?: number | null,
 *   locationLabel?: string,
 *   defaultCityId?: string,
 *   readOnly?: boolean,
 *   nested?: boolean,
 *   suppressFullscreen?: boolean,
 *   style?: import('react').CSSProperties,
 *   onChange?: (patch: { latitude?: number, longitude?: number, location?: string }) => void,
 * }} props
 */
export function LocationMapPicker({
  latitude,
  longitude,
  locationLabel = "",
  defaultCityId = "",
  readOnly = false,
  nested = false,
  suppressFullscreen = false,
  style,
  onChange = () => {},
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(locationLabel || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const mapRef = useRef(null);
  const dragRef = useRef(null);
  const pinchRef = useRef(null);
  const activePointers = useRef(new Map());
  const [viewSize, setViewSize] = useState({ w: 320, h: 180 });

  const seedCenter = useMemo(() => {
    if (latitude != null && longitude != null) return { lat: latitude, lng: longitude };
    return getCityMapCenter(defaultCityId);
  }, [latitude, longitude, defaultCityId]);

  const [center, setCenter] = useState(seedCenter);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const hasPin = latitude != null && longitude != null;

  useLayoutEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const measure = () => {
      setViewSize({ w: Math.max(200, el.clientWidth), h: Math.max(120, el.clientHeight) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { tiles, originX, originY } = useMemo(
    () => buildTileLayout(center.lat, center.lng, zoom, viewSize.w, viewSize.h),
    [center.lat, center.lng, zoom, viewSize.w, viewSize.h],
  );

  const pinStyle = useMemo(() => {
    if (!hasPin) return null;
    const pinPx = latLngToWorldPx(latitude, longitude, zoom);
    return {
      left: pinPx.x - originX,
      top: pinPx.y - originY,
    };
  }, [hasPin, latitude, longitude, zoom, originX, originY]);

  const applyPin = useCallback(
    async (nextLat, nextLng, labelHint = "", recenter = true) => {
      if (readOnly) return;
      const label = labelHint || (await reverseGeocode(nextLat, nextLng));
      onChange({ latitude: nextLat, longitude: nextLng, location: label });
      setSearch(label);
      if (recenter) setCenter({ lat: nextLat, lng: nextLng });
    },
    [onChange, readOnly],
  );

  const coordsFromPointer = useCallback(
    (clientX, clientY) => {
      const el = mapRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const centerPx = latLngToWorldPx(center.lat, center.lng, zoom);
      const originXClick = centerPx.x - rect.width / 2;
      const originYClick = centerPx.y - rect.height / 2;
      return worldPxToLatLng(originXClick + px, originYClick + py, zoom);
    },
    [center.lat, center.lng, zoom],
  );

  const dropPinAtPointer = useCallback(
    async (clientX, clientY) => {
      const coords = coordsFromPointer(clientX, clientY);
      if (!coords) return;
      setBusy(true);
      setError("");
      try {
        await applyPin(coords.lat, coords.lng, "", false);
      } finally {
        setBusy(false);
      }
    },
    [applyPin, coordsFromPointer],
  );

  const onMapPointerDown = useCallback(
    (e) => {
      if (readOnly || busy) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      e.currentTarget.setPointerCapture(e.pointerId);

      if (activePointers.current.size === 1) {
        const centerPx = latLngToWorldPx(center.lat, center.lng, zoom);
        dragRef.current = {
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          originCenterPx: centerPx,
          moved: false,
        };
      } else if (activePointers.current.size === 2) {
        dragRef.current = null;
        const pts = [...activePointers.current.values()];
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        pinchRef.current = {
          startDist: Math.hypot(dx, dy),
          startZoom: zoom,
        };
      }
    },
    [busy, center.lat, center.lng, zoom, readOnly],
  );

  const onMapPointerMove = useCallback(
    (e) => {
      if (readOnly) return;
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2 && pinchRef.current) {
        const pts = [...activePointers.current.values()];
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        const dist = Math.hypot(dx, dy);
        const scale = dist / pinchRef.current.startDist;
        const rawZoom = pinchRef.current.startZoom + Math.log2(scale);
        setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(rawZoom))));
        return;
      }

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      drag.moved = true;
      const next = worldPxToLatLng(
        drag.originCenterPx.x - dx,
        drag.originCenterPx.y - dy,
        zoom,
      );
      setCenter(next);
    },
    [zoom, readOnly],
  );

  const onMapPointerUp = useCallback(
    (e) => {
      if (readOnly) return;
      activePointers.current.delete(e.pointerId);
      e.currentTarget.releasePointerCapture(e.pointerId);

      if (activePointers.current.size < 2) {
        pinchRef.current = null;
      }

      const drag = dragRef.current;
      if (drag && drag.pointerId === e.pointerId) {
        if (!drag.moved) {
          void dropPinAtPointer(e.clientX, e.clientY);
        }
        dragRef.current = null;
      }
    },
    [dropPinAtPointer, readOnly],
  );

  const onMapPointerCancel = useCallback(
    (e) => {
      if (readOnly) return;
      activePointers.current.delete(e.pointerId);
      if (dragRef.current?.pointerId === e.pointerId) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        dragRef.current = null;
      }
    },
    [readOnly],
  );

  const useMyLocation = useCallback(() => {
    if (readOnly) return;
    setError("");
    if (!navigator.geolocation) {
      setError(t("wealthDetail.map.geoUnsupported"));
      return;
    }
    setBusy(true);
    (async () => {
      if (isNativeCapacitorShell()) {
        const perm = await requestNativePermission("location");
        if (perm !== "granted") {
          setError(t("wealthDetail.map.geoDenied"));
          setBusy(false);
          return;
        }
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const nextLat = roundCoord(pos.coords.latitude);
          const nextLng = roundCoord(pos.coords.longitude);
          await applyPin(nextLat, nextLng);
          setBusy(false);
        },
        () => {
          setError(t("wealthDetail.map.geoDenied"));
          setBusy(false);
        },
        { enableHighAccuracy: true, timeout: 12000 },
      );
    })();
  }, [applyPin, t, readOnly]);

  const searchPlace = useCallback(async () => {
    if (readOnly) return;
    const q = search.trim();
    if (!q) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
        { headers: { Accept: "application/json" } },
      );
      const data = await res.json();
      if (!data?.length) {
        setError(t("wealthDetail.map.notFound"));
        setBusy(false);
        return;
      }
      const hit = data[0];
      const nextLat = roundCoord(Number(hit.lat));
      const nextLng = roundCoord(Number(hit.lon));
      const deepLabel = await reverseGeocode(nextLat, nextLng);
      await applyPin(nextLat, nextLng, deepLabel);
      setZoom(DEFAULT_ZOOM);
      setBusy(false);
    } catch {
      setError(t("wealthDetail.map.searchFailed"));
      setBusy(false);
    }
  }, [applyPin, search, t, readOnly]);

  const mapStyle = /** @type {import("react").CSSProperties} */ ({
    display: "block",
    width: "100%",
    border: nested ? "none" : "0.5px solid var(--ed-rule)",
    borderRadius: nested ? 0 : 10,
    overflow: "hidden",
    height: nested ? "100%" : 200,
    flex: nested ? 1 : undefined,
    cursor: readOnly ? "default" : busy ? "wait" : "grab",
    touchAction: readOnly ? "auto" : "none",
    background: "#e8eef4",
    position: "relative",
    userSelect: "none",
    ...style,
  });

  return (
    <div className={nested ? undefined : "ed-you-field"} style={nested ? { height: "100%", display: "flex", flexDirection: "column" } : undefined}>
      {!readOnly && !nested ? (
        <>
          <div className="ed-you-field-label">{t("wealthDetail.map.title")}</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <input
              className="ed-you-input"
              style={{ flex: 1 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("wealthDetail.map.searchPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchPlace();
                }
              }}
            />
            <button type="button" className="ed-option-btn" style={{ flex: "0 0 auto" }} disabled={busy} onClick={searchPlace}>
              {t("wealthDetail.map.searchBtn")}
            </button>
          </div>
        </>
      ) : null}
      <div
        ref={mapRef}
        className="location-map-drop"
        role="application"
        aria-label={t("wealthDetail.map.dropPin")}
        onPointerDown={onMapPointerDown}
        onPointerMove={onMapPointerMove}
        onPointerUp={onMapPointerUp}
        onPointerCancel={onMapPointerCancel}
        style={mapStyle}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            loading="lazy"
            style={{
              position: "absolute",
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}
        {pinStyle ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: pinStyle.left,
              top: pinStyle.top,
              width: 14,
              height: 14,
              marginLeft: -7,
              marginTop: -14,
              borderRadius: "50% 50% 50% 0",
              background: "var(--ct-danger, #dc2626)",
              border: "2px solid #fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
              transform: "rotate(-45deg)",
              pointerEvents: "none",
            }}
          />
        ) : null}
        {!readOnly && !suppressFullscreen ? (
          <button
            type="button"
            aria-label={t("wealthDetail.map.expandMap")}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setFullscreen(true);
            }}
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              zIndex: 2,
              width: 32,
              height: 32,
              borderRadius: 6,
              background: "rgba(255,255,255,0.85)",
              border: "0.5px solid rgba(0,0,0,0.15)",
              cursor: "pointer",
              fontSize: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            ⤢
          </button>
        ) : null}
        <span
          style={{
            position: "absolute",
            right: 4,
            bottom: 2,
            fontSize: 9,
            color: "rgba(0,0,0,0.55)",
            background: "rgba(255,255,255,0.75)",
            padding: "1px 4px",
            borderRadius: 3,
            pointerEvents: "none",
          }}
        >
          © OpenStreetMap
        </span>
      </div>
      {!readOnly && !nested ? (
        <span
          style={{
            fontSize: 11,
            color: "var(--ed-ink-faint)",
            display: "block",
            marginTop: 4,
            fontStyle: "italic",
          }}
        >
          {t("wealthDetail.map.gestureHint")}
        </span>
      ) : null}
      {!readOnly && !nested ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" className="ed-you-text-btn" disabled={busy} onClick={useMyLocation}>
            {busy ? t("common.loading") : t("wealthDetail.map.useMyLocation")}
          </button>
          {hasPin ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: "var(--ed-font)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--ed-ink-soft)",
                  letterSpacing: "0.01em",
                }}
              >
                {t("wealthDetail.map.coords", {
                  lat: latitude?.toFixed(6),
                  lng: longitude?.toFixed(6),
                })}
              </span>
              <span
                style={{
                  fontFamily: "var(--ed-font-news)",
                  fontSize: 11,
                  fontStyle: "italic",
                  color: "var(--ed-ink-faint)",
                }}
              >
                {t("wealthDetail.map.precisionNote")}
              </span>
            </div>
          ) : (
            <span className="ed-you-field-hint" style={{ margin: 0 }}>
              {t("wealthDetail.map.tapToDropPin")}
            </span>
          )}
        </div>
      ) : null}
      {error ? <div className="ed-you-note error">{error}</div> : null}

      {fullscreen && !suppressFullscreen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "#e8eef4",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "var(--ed-bg)",
              borderBottom: "0.5px solid var(--ed-rule)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--ed-font)",
                  fontWeight: 600,
                  fontSize: 14,
                  color: "var(--ed-ink)",
                }}
              >
                {t("wealthDetail.map.fullscreenTitle")}
              </div>
              {hasPin ? (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ed-ink-faint)",
                    fontFamily: "var(--ed-font)",
                    marginTop: 2,
                  }}
                >
                  {t("wealthDetail.map.coords", {
                    lat: latitude?.toFixed(6),
                    lng: longitude?.toFixed(6),
                  })}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label={t("common.close")}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                color: "var(--ed-ink)",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, position: "relative", overflow: "auto", padding: "0 16px 16px" }}>
            <LocationMapPicker
              suppressFullscreen
              latitude={latitude}
              longitude={longitude}
              locationLabel={locationLabel}
              defaultCityId={defaultCityId}
              readOnly={false}
              style={{ height: 280, borderRadius: 10 }}
              onChange={(patch) => {
                onChange(patch);
                if (patch.location) setSearch(patch.location);
              }}
            />
          </div>

          <div style={{ padding: 16, background: "var(--ed-bg)", borderTop: "0.5px solid var(--ed-rule)" }}>
            <button
              type="button"
              className="ed-btn ed-btn-primary ed-btn-block"
              onClick={() => setFullscreen(false)}
            >
              {t("wealthDetail.map.confirmPin")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
