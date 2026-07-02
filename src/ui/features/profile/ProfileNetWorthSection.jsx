import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SegmentedControl, Button, EmptyState } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useProfileHubIntel } from "../../../hooks/useProfileHubIntel.js";
import FinancialLifeOverviewPanel from "./hub/FinancialLifeOverviewPanel.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { partitionWealth } from "../../../engines/netWorth/core.js";
import { deriveWealthFromCommitments } from "../../../engines/netWorth/commitmentWealth.js";
import WealthEntryCard from "../netWorth/WealthEntryCard.jsx";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import ProfileMilestonesPanel from "./hub/ProfileMilestonesPanel.jsx";
import { formatInr } from "../../../constants/symbols.js";

/** Profile wealth ledger — journey patterns, assets, and liabilities. */
export default function ProfileNetWorthSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const hub = useProfileHubIntel();
  const { commitments, getEffectiveStatus, todayStr } = usePerovo();
  const { addEntry, updateEntry, deleteEntry, privacyMode } = useNetWorth();
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(/** @type {{ kind: 'asset'|'liability', entry?: object } | null} */ (null));

  const { assets, liabilities } = useMemo(
    () => partitionWealth(intel.entries),
    [intel.entries]
  );

  const fromBills = useMemo(
    () => deriveWealthFromCommitments(commitments, getEffectiveStatus, todayStr),
    [commitments, getEffectiveStatus, todayStr]
  );

  const billSourceLabel = t("netWorth.fromBills");
  const openBill = (commitmentId) => navigate("/ledger/bills", { state: { openBillId: commitmentId } });

  const openAdd = (kind) => setModal({ kind });
  const openEdit = (entry) => setModal({ kind: entry.kind, entry });

  const hasAssets = assets.length > 0 || fromBills.assets.length > 0;
  const hasLiabilities = liabilities.length > 0 || fromBills.liabilities.length > 0;
  const netWorthDisplay = privacyMode ? "••••••" : formatInr(intel.core.netWorth);

  return (
    <div className="ct-stack ct-nw-embedded ct-profile-settings-panel">
      <div className="ct-hero-card wealth">
        <div className="ct-hero-glow teal" aria-hidden />
        <p className="ct-hero-label">{t("netWorth.hero.eyebrow")}</p>
        <p className="ct-hero-number">{netWorthDisplay}</p>
      </div>

      <SegmentedControl
        options={[
          { id: "overview", label: t("netWorth.tab.overview") },
          { id: "milestones", label: t("netWorth.tab.milestones") },
          { id: "assets", label: t("netWorth.tab.assets") },
          { id: "liabilities", label: t("netWorth.tab.liabilities") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "overview" && (
        <FinancialLifeOverviewPanel hub={hub} insights={intel.insights} />
      )}

      {tab === "milestones" && <ProfileMilestonesPanel />}

      {tab === "assets" && (
        <div className="ct-stack ct-list-animate">
          {!hasAssets ? (
            <EmptyState icon="bank" title={t("netWorth.empty.assets")} hint="" />
          ) : (
            <>
              {fromBills.assets.map((a) => (
                <WealthEntryCard
                  key={a.id}
                  entry={a}
                  privacyMode={privacyMode}
                  readOnly
                  sourceLabel={billSourceLabel}
                  onOpen={() => openBill(a.commitmentId)}
                />
              ))}
              {assets.map((a) => {
                const row = intel.core.assetAllocation.find((x) => x.id === a.id);
                return (
                  <WealthEntryCard
                    key={a.id}
                    entry={a}
                    pct={row?.pct}
                    privacyMode={privacyMode}
                    onEdit={openEdit}
                    onDelete={deleteEntry}
                  />
                );
              })}
            </>
          )}
          <Button type="button" variant="primary" onClick={() => openAdd("asset")}>
            {t("netWorth.addAsset")}
          </Button>
        </div>
      )}

      {tab === "liabilities" && (
        <div className="ct-stack ct-list-animate">
          {!hasLiabilities ? (
            <EmptyState icon="credit-card" title={t("netWorth.empty.liabilities")} hint="" />
          ) : (
            <>
              {fromBills.liabilities.map((l) => (
                <WealthEntryCard
                  key={l.id}
                  entry={l}
                  privacyMode={privacyMode}
                  readOnly
                  sourceLabel={billSourceLabel}
                  onOpen={() => openBill(l.commitmentId)}
                />
              ))}
              {liabilities.map((l) => {
                const row = intel.core.liabilityAllocation.find((x) => x.id === l.id);
                return (
                  <WealthEntryCard
                    key={l.id}
                    entry={l}
                    pct={row?.pct}
                    privacyMode={privacyMode}
                    onEdit={openEdit}
                    onDelete={deleteEntry}
                  />
                );
              })}
            </>
          )}
          <Button type="button" variant="primary" onClick={() => openAdd("liability")}>
            {t("netWorth.addLiability")}
          </Button>
        </div>
      )}

      <WealthEntryModal
        open={Boolean(modal)}
        kind={modal?.kind}
        entry={modal?.entry}
        onClose={() => setModal(null)}
        onSave={(payload) => {
          if (modal?.entry) updateEntry(modal.entry.id, payload);
          else addEntry(payload);
        }}
      />
    </div>
  );
}
