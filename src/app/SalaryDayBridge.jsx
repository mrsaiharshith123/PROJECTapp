import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePerovo } from "../context/PerovoContext.jsx";
import { isSalaryCreditToday, planGoalAutoSave } from "../engines/goalAutoSave.js";

const PAYCHECK_NAV_KEY = "perovo_paycheck_nav_date";

/** Salary-day auto-save + optional navigate to Paycheck. */
export default function SalaryDayBridge() {
  const navigate = useNavigate();
  const { settings, todayStr, goals, logSavingsToGoal, updateSettings } = usePerovo();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !todayStr) return;
    const salaryDay = settings.salaryCreditDay;
    if (!isSalaryCreditToday(todayStr, salaryDay)) return;
    ran.current = true;

    const plan = planGoalAutoSave({
      rules: settings.goalAutoSaveRules,
      goals,
      todayStr,
      salaryCreditDay: salaryDay,
      lastRunDate: settings.goalAutoSaveLastRun,
    });

    if (plan.shouldRun) {
      for (const credit of plan.credits) {
        logSavingsToGoal(credit.goalId, credit.amount);
      }
      updateSettings({ goalAutoSaveLastRun: plan.nextLastRun });
    }

    try {
      const lastNav = sessionStorage.getItem(PAYCHECK_NAV_KEY);
      if (lastNav !== todayStr) {
        sessionStorage.setItem(PAYCHECK_NAV_KEY, todayStr);
        navigate("/paycheck", { replace: false });
      }
    } catch {
      /* ignore */
    }
  }, [todayStr, settings.salaryCreditDay, settings.goalAutoSaveRules, settings.goalAutoSaveLastRun, goals, logSavingsToGoal, updateSettings, navigate]);

  return null;
}
