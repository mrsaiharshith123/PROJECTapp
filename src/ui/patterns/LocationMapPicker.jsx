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
  return Math.round(n * 1e5) / 1e5;
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
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } },
    );
    const data = await res.json();
    return data.display_name?.split(",").slice(0, 3).join(", ") || `${lat}, ${lng}`;
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
  style,
  onChange = () => {},
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(locationLabel || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);
  const dragRef = useRef(null);
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
      const centerPx = latLngToWorldPx(center.lat, center.lng, zoom);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originCenterPx: centerPx,
        moved: false,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [busy, center.lat, center.lng, zoom, readOnly],
  );

  const onMapPointerMove = useCallback(
    (e) => {
      if (readOnly) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    const next = worldPxToLatLng(drag.originCenterPx.x - dx, drag.originCenterPx.y - dy, zoom);
    setCenter(next);
  }, [zoom, readOnly]);

  const onMapPointerUp = useCallback(
    (e) => {
      if (readOnly) return;
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (!drag.moved) {
        void dropPinAtPointer(e.clientX, e.clientY);
      }
      dragRef.current = null;
    },
    [dropPinAtPointer, readOnly],
  );

  const onMapPointerCancel = useCallback(
    (e) => {
      if (readOnly) return;
    if (dragRef.current?.pointerId === e.pointerId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    }
  }, []);

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
      await applyPin(
        nextLat,
        nextLng,
        hit.display_name?.split(",").slice(0, 3).join(", ") || q,
      );
      setZoom(DEFAULT_ZOOM);
      setBusy(false);
    } catch {
      setError(t("wealthDetail.map.searchFailed"));
      setBusy(false);
    }
  }, [applyPin, search, t, readOnly]);

  const zoomIn = () => {
    if (readOnly) return;
    setZoom((z) => Math.min(MAX_ZOOM, z + 1));
  };
  const zoomOut = () => {
    if (readOnly) return;
    setZoom((z) => Math.max(MIN_ZOOM, z - 1));
  };

  const mapStyle = /** @type {import("react").CSSProperties} */ ({
    display: "block",
    width: "100%",
    border: "0.5px solid var(--ed-rule)",
    borderRadius: 10,
    overflow: "hidden",
    height: 200,
    cursor: readOnly ? "default" : busy ? "wait" : "grab",
    touchAction: readOnly ? "auto" : "none",
    background: "#e8eef4",
    position: "relative",
    userSelect: "none",
    ...style,
  });

  return (
    <div className="ed-you-field">
      {!readOnly ? (
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
        {!readOnly ? (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              zIndex: 2,
            }}
          >
            <button
              type="button"
              className="ed-option-btn"
              style={{ width: 32, height: 32, padding: 0, lineHeight: 1 }}
              aria-label={t("wealthDetail.map.zoomIn")}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                zoomIn();
              }}
            >
              +
            </button>
            <button
              type="button"
              className="ed-option-btn"
              style={{ width: 32, height: 32, padding: 0, lineHeight: 1 }}
              aria-label={t("wealthDetail.map.zoomOut")}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                zoomOut();
              }}
            >
              −
            </button>
          </div>
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
      {!readOnly ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" className="ed-you-text-btn" disabled={busy} onClick={useMyLocation}>
            {busy ? t("common.loading") : t("wealthDetail.map.useMyLocation")}
          </button>
          {hasPin ? (
            <span className="ed-you-field-hint" style={{ margin: 0 }}>
              {t("wealthDetail.map.pinned", { lat: latitude, lng: longitude })}
            </span>
          ) : (
            <span className="ed-you-field-hint" style={{ margin: 0 }}>
              {t("wealthDetail.map.hint")}
            </span>
          )}
        </div>
      ) : null}
      {error ? <div className="ed-you-note error">{error}</div> : null}
    </div>
  );
}
