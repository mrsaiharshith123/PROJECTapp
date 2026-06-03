import { useRef } from "react";
import { resolveProfileAvatar } from "../../../constants/profileAvatars.js";

const MAX_IMAGE_BYTES = 400_000;

export default function ProfileAvatar({ settings, updateSettings, size = "lg" }) {
  const fileRef = useRef(null);
  const { style, imageUrl, isUploaded, mode } = resolveProfileAvatar(settings);

  const sizeClass =
    size === "sm" ? "w-16 h-16 text-3xl" : "w-24 h-24 text-5xl ring-4 ring-white/30";

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > MAX_IMAGE_BYTES) {
      alert("Please choose an image under 400 KB.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateSettings({
        avatarSource: "upload",
        profileImageDataUrl: String(reader.result || ""),
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const useCartoon = () => {
    updateSettings({ avatarSource: "auto", profileImageDataUrl: "" });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative rounded-2xl overflow-hidden shadow-lg flex items-center justify-center bg-gradient-to-br ${style.gradient} ${sizeClass}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="select-none" role="img" aria-label={style.label}>
            {style.character}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
        {isUploaded ? "Your photo" : `${mode.emoji} ${style.label} avatar`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Upload photo
        </button>
        {isUploaded && (
          <button
            type="button"
            onClick={useCartoon}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200"
          >
            Use cartoon
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
