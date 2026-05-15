export {
  calculateSimpleInterest,
  calculateMonthlyEMI,
  calculateTotalPayableSimple,
  calculateLatePenalty,
  calculateSalaryImpact,
  calculateInterestSaved,
} from "./calculations.js";

export {
  generateRepaymentSchedule,
  getNextInstallment,
  sumScheduleInterest,
} from "./schedule.js";

export {
  applyPaymentToSchedule,
  calculateRemainingFromSchedule,
  applyPrepaymentToSchedule,
} from "./payments.js";
