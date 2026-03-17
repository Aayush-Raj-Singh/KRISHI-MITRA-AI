import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const useDashboardHashScroll = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.replace("#", ""));
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash]);
};

export default useDashboardHashScroll;
