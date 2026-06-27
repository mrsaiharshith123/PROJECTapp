import { useCallback, useEffect, useRef, useState } from "react";
import {
  applyDevPhoneFrameBootAttrs,
  DEV_PHONE_CHANGE_EVENT,
  DEV_PHONE_PRESETS,
  getDevPhoneDevice,
  isDevPhoneFrameCapable,
  setDevPhoneDevice,
} from "../../utils/devPhoneFrame.js";
import "./dev-phone-frame.css";

const CONTROL_BAR_H = 40;

function usePhoneDevice() {
  const [device, setDevice] = useState(() => getDevPhoneDevice());

  useEffect(() => {
    if (!isDevPhoneFrameCapable()) return undefined;
    const sync = () => setDevice(getDevPhoneDevice());
    window.addEventListener(DEV_PHONE_CHANGE_EVENT, sync);
    return () => window.removeEventListener(DEV_PHONE_CHANGE_EVENT, sync);
  }, []);

  return { device, setDevice };
}

function computeFillScale(device) {
  if (typeof window === "undefined") return 1;
  const pad = 12;
  const availW = window.innerWidth - pad;
  const availH = window.innerHeight - CONTROL_BAR_H - pad;
  if (availW <= 0 || availH <= 0) return 1;
  return Math.min(availW / device.width, availH / device.height);
}

/**
 * Localhost-only full-screen phone shell for dev testing.
 * @param {{ children: import("react").ReactNode }} props
 */
export default function DevPhoneFrame({ children }) {
  const capable = isDevPhoneFrameCapable();
  const { device, setDevice } = usePhoneDevice();
  const widthRef = useRef(null);
  const heightRef = useRef(null);
  const [scale, setScale] = useState(() => computeFillScale(device));

  useEffect(() => {
    if (!capable) return;
    applyDevPhoneFrameBootAttrs();
  }, [capable, device]);

  useEffect(() => {
    if (!capable) return undefined;
    const update = () => setScale(computeFillScale(device));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [capable, device]);

  useEffect(() => {
    if (!capable) return;
    document.documentElement.style.setProperty("--dev-phone-scale", String(scale));
    return () => {
      document.documentElement.style.removeProperty("--dev-phone-scale");
    };
  }, [capable, scale]);

  const onPresetChange = useCallback(
    (id) => {
      const preset = DEV_PHONE_PRESETS.find((p) => p.id === id);
      if (!preset) return;
      setDevPhoneDevice(preset);
      setDevice(preset);
    },
    [setDevice],
  );

  const applyCustomSize = useCallback(() => {
    const width = Number(widthRef.current?.value);
    const height = Number(heightRef.current?.value);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return;
    if (width < 320 || width > 520 || height < 568 || height > 1200) return;
    const next = {
      id: "custom",
      label: `${Math.round(width)} × ${Math.round(height)}`,
      width: Math.round(width),
      height: Math.round(height),
    };
    setDevPhoneDevice(next);
    setDevice(next);
  }, [setDevice]);

  if (!capable) return children;

  const presetValue = DEV_PHONE_PRESETS.some((p) => p.id === device.id) ? device.id : "custom";
  const sizeKey = `${device.width}x${device.height}`;

  return (
    <div className="dev-phone-stage">
      <div className="dev-phone-controls" aria-label="Device size">
        <select
          id="dev-phone-preset"
          className="dev-phone-select"
          value={presetValue}
          onChange={(e) => {
            if (e.target.value === "custom") return;
            onPresetChange(e.target.value);
          }}
        >
          {DEV_PHONE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <input
          key={`w-${sizeKey}`}
          ref={widthRef}
          className="dev-phone-input"
          type="number"
          min={320}
          max={520}
          defaultValue={device.width}
          aria-label="Width"
        />
        <span className="dev-phone-times">×</span>
        <input
          key={`h-${sizeKey}`}
          ref={heightRef}
          className="dev-phone-input"
          type="number"
          min={568}
          max={1200}
          defaultValue={device.height}
          aria-label="Height"
        />
        <button type="button" className="dev-phone-btn" onClick={applyCustomSize}>
          Apply
        </button>
        <span className="dev-phone-meta">
          {device.width}×{device.height} · {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="dev-phone-viewport">
        <div
          className="dev-phone-frame"
          style={{
            width: device.width,
            height: device.height,
            transform: `scale(${scale})`,
          }}
          aria-label={`${device.label} preview`}
        >
          <div className="dev-phone-screen">{children}</div>
        </div>
      </div>
    </div>
  );
}
