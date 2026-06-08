import { useMemo, useState } from "react";
import { SegmentedControl, Button, EmptyState } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useNetWorthIntel } from "../../../hooks/useNetWorthIntel.js";
import { useProfileHubIntel } from "../../../hooks/useProfileHubIntel.js";
import ProfileJourneyPanel from "./hub/ProfileJourneyStrip.jsx";
import { useNetWorth } from "../../../context/NetWorthContext.jsx";
import { partitionWealth } from "../../../engines/netWorth/core.js";
import WealthEntryCard from "../netWorth/WealthEntryCard.jsx";
import WealthEntryModal from "../netWorth/WealthEntryModal.jsx";
import {
  LiquidityPanel,
  HealthScorePanel,
  PressureWealthPanel,
  InsightsPanel,
  AllocationCharts,
  SimulationPanel,
  TimelinePanel,
  MilestonesStrip,
} from "../netWorth/NetWorthIntelligencePanels.jsx";

/** Embedded net worth / financial life intelligence (profile panel). */
export default function ProfileNetWorthSection() {
  const { t } = useTranslation();
  const intel = useNetWorthIntel();
  const hub = useProfileHubIntel();
  const { addEntry, updateEntry, deleteEntry, privacyMode } = useNetWorth();
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(/** @type {{ kind: 'asset'|'liability', entry?: object } | null} */ (null));

  const { assets, liabilities } = useMemo(
    () => partitionWealth(intel.entries),
    [intel.entries]
  );

  const isEmpty = intel.entries.length === 0;
  const openAdd = (kind) => setModal({ kind });
  const openEdit = (entry) => setModal({ kind: entry.kind, entry });

  return (
    <div className="ct-stack ct-nw-embedded">
      <MilestonesStrip milestones={intel.milestones} />

      <SegmentedControl
        options={[
          { id: "overview", label: t("netWorth.tab.overview") },
          { id: "assets", label: t("netWorth.tab.assets") },
          { id: "liabilities", label: t("netWorth.tab.liabilities") },
          { id: "simulate", label: t("netWorth.tab.simulate") },
          { id: "timeline", label: t("netWorth.tab.timeline") },
        ]}
        value={tab}
        onChange={setTab}
      />

      {isEmpty && tab !== "simulate" && tab !== "overview" && (
        <EmptyState icon="chart-pie-slice" title={t("netWorth.empty.title")} hint={t("netWorth.empty.body")} />
      )}

      {tab === "overview" && (
        <div className="ct-stack">
          <ProfileJourneyPanel hub={hub} />
          {isEmpty ? (
            <EmptyState icon="chart-pie-slice" title={t("netWorth.empty.title")} hint={t("netWorth.empty.body")} />
          ) : (
            <>
              <InsightsPanel insights={intel.insights} />
              <LiquidityPanel liquidity={intel.liquidity} privacyMode={privacyMode} />
              <HealthScorePanel lifeScore={intel.lifeScore} />
              <PressureWealthPanel pressure={intel.pressure} cashFlow={intel.cashFlow} privacyMode={privacyMode} />
              <AllocationCharts intel={intel} privacyMode={privacyMode} />
            </>
          )}
        </div>
      )}

      {tab === "assets" && (
        <div className="ct-stack ct-list-animate">
          {assets.length === 0 ? (
            <EmptyState icon="bank" title={t("netWorth.empty.assets")} hint="" />
          ) : (
            assets.map((a) => {
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
            })
          )}
          <Button type="button" variant="primary" onClick={() => openAdd("asset")}>
            {t("netWorth.addAsset")}
          </Button>
        </div>
      )}

      {tab === "liabilities" && (
        <div className="ct-stack ct-list-animate">
          {liabilities.length === 0 ? (
            <EmptyState icon="credit-card" title={t("netWorth.empty.liabilities")} hint="" />
          ) : (
            liabilities.map((l) => {
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
            })
          )}
          <Button type="button" variant="primary" onClick={() => openAdd("liability")}>
            {t("netWorth.addLiability")}
          </Button>
        </div>
      )}

      {tab === "simulate" && <SimulationPanel simulationBase={intel.simulationBase} />}
      {tab === "timeline" && <TimelinePanel timeline={intel.timeline} />}

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
