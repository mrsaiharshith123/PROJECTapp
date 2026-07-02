/** @route /insights — category sections with swipeable insight cards */
import InsightsEditorialPage from "../insights/InsightsEditorialPage.jsx";
import { useInsightsData } from "../insights/useInsightsData.js";

const Analytics = () => {
  const carouselData = useInsightsData();
  return <InsightsEditorialPage data={carouselData} />;
};

export default Analytics;
