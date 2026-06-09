/** Gratuity estimate under Payment of Gratuity Act (salaried, 5+ years). */

/**
 * @param {object} input
 * @param {number} input.lastDrawnMonthlySalary Basic + DA style last drawn salary
 * @param {number} input.yearsOfService Completed years (fractional ok)
 */
export function computeGratuityEstimate(input) {
  const salary = Math.max(0, Number(input.lastDrawnMonthlySalary) || 0);
  const years = Math.max(0, Number(input.yearsOfService) || 0);
  const eligible = years >= 5 && salary > 0;

  if (!eligible) {
    return {
      eligible: false,
      estimatedGratuity: 0,
      yearsOfService: years,
      narrativeLines: [
        years < 5
          ? "Gratuity typically applies after 5 years of continuous service."
          : "Enter last drawn monthly salary to estimate gratuity.",
      ],
    };
  }

  const estimated = Math.round(((15 * salary * years) / 26) * 100) / 100;

  return {
    eligible: true,
    estimatedGratuity: Math.round(estimated),
    yearsOfService: years,
    formula: "(15 × last drawn salary × years) ÷ 26",
    narrativeLines: [
      `Estimated gratuity about ₹${Math.round(estimated).toLocaleString("en-IN")} at exit.`,
      "Actual payout depends on employer policy and qualifying salary components.",
    ],
  };
}
