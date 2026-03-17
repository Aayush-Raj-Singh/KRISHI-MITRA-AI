import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  Stack,
  Typography
} from "@mui/material";

import { useTranslatedStrings } from "../../utils/useTranslatedStrings";

type OnboardingDialogProps = {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
};

const OnboardingDialog: React.FC<OnboardingDialogProps> = ({ open, onClose, onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);

  const baseStrings = useMemo(
    () => ({
      title: "Welcome to KrishiMitra-AI",
      subtitle: "A quick walkthrough to help you get started.",
      step1Title: "Complete your farm profile",
      step1Body: "Add location, soil data, and primary crops for personalized recommendations.",
      step2Title: "Generate AI recommendations",
      step2Body: "Use crop, price, and water tools to plan your season with confidence.",
      step3Title: "Use advisory chat",
      step3Body: "Ask questions in your language and get grounded responses with sources.",
      step4Title: "Submit outcomes",
      step4Body: "Rate recommendations and submit results to improve sustainability scores.",
      next: "Next",
      back: "Back",
      skip: "Skip",
      done: "Finish"
    }),
    []
  );

  const translated = useTranslatedStrings(baseStrings);

  const steps = [
    { title: translated.step1Title, body: translated.step1Body },
    { title: translated.step2Title, body: translated.step2Body },
    { title: translated.step3Title, body: translated.step3Body },
    { title: translated.step4Title, body: translated.step4Body }
  ];

  useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (activeStep >= steps.length - 1) {
      onComplete();
      setActiveStep(0);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSkip = () => {
    onComplete();
    setActiveStep(0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{translated.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {translated.subtitle}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step key={step.title}>
                <StepLabel />
              </Step>
            ))}
          </Stepper>
          <Stack spacing={1}>
            <Typography variant="subtitle1">{steps[activeStep]?.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {steps[activeStep]?.body}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} color="secondary">
          {translated.skip}
        </Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            {translated.back}
          </Button>
          <Button variant="contained" onClick={handleNext}>
            {activeStep >= steps.length - 1 ? translated.done : translated.next}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingDialog;
