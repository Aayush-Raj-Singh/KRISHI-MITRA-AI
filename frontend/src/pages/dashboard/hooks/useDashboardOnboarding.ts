import { useEffect, useState } from "react";

import { useTranslatedStrings } from "../../../utils/useTranslatedStrings";

const useDashboardOnboarding = () => {
  const onboardingLabels = useTranslatedStrings({
    startTour: "Start tutorial"
  });
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem("krishimitra:onboarding_seen");
      if (!seen) {
        setOnboardingOpen(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem("krishimitra:onboarding_seen", "true");
    } catch {
      // ignore storage errors
    }
    setOnboardingOpen(false);
  };

  return {
    onboardingLabels,
    onboardingOpen,
    setOnboardingOpen,
    handleOnboardingComplete
  };
};

export default useDashboardOnboarding;
