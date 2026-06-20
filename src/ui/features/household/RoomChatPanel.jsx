import { Caption, Body, Stack } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { isChatConfigured } from "../../../services/chat/streamChat.js";
import { CtIcon } from "../../icons/CtIcon.jsx";

/** Family room chat — Stream.io when VITE_STREAM_API_KEY + stream-token edge function are set. */
export default function RoomChatPanel() {
  const { t } = useTranslation();
  const configured = isChatConfigured();

  return (
    <Stack className="ct-stack-sm">
      <div className="ct-row gap-3 items-start">
        <span className={`ct-icon-tile ${configured ? "teal" : "violet"}`} aria-hidden>
          <CtIcon name="chat-circle" size={22} context="category" />
        </span>
        <div>
          <Body>{configured ? t("household.room.tabChat") : t("household.chat.comingSoon")}</Body>
          <Caption className="block mt-1">
            {configured ? t("household.chat.configuredHint") : t("household.chat.comingSoonHint")}
          </Caption>
        </div>
      </div>
    </Stack>
  );
}
