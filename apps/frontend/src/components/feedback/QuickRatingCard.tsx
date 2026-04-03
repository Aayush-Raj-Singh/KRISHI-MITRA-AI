import React, { useMemo, useState } from "react";
import { Button, Card, CardContent, Rating, Stack, TextField, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";

import { submitQuickFeedback } from "../../services/feedback";
import { useTranslatedStrings } from "../../utils/useTranslatedStrings";

type QuickRatingCardProps = {
  recommendationId?: string | null;
  service: "crop" | "price" | "water" | "advisory";
};

const QuickRatingCard: React.FC<QuickRatingCardProps> = ({ recommendationId, service }) => {
  const [rating, setRating] = useState<number | null>(4);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const labels = useMemo(
    () => ({
      title: "Rate this recommendation",
      subtitle: "Your feedback helps improve model quality.",
      ratingLabel: "How useful was this?",
      noteLabel: "Optional note",
      submit: "Submit rating",
      thanks: "Thanks for rating.",
      submitting: "Submitting...",
    }),
    [],
  );
  const translated = useTranslatedStrings(labels);

  const mutation = useMutation({
    mutationFn: submitQuickFeedback,
    onSuccess: () => {
      setSubmitted(true);
      setNotes("");
    },
  });

  const handleSubmit = () => {
    if (!rating) return;
    mutation.mutate({
      recommendation_id: recommendationId || undefined,
      rating,
      service,
      notes: notes.trim() || undefined,
      source: "web",
    });
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1">{translated.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {translated.subtitle}
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">{translated.ratingLabel}</Typography>
            <Rating
              name={`${service}-quick-rating`}
              value={rating}
              onChange={(_, value) => setRating(value)}
              size="large"
            />
          </Stack>
          <TextField
            label={translated.noteLabel}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={mutation.isPending || !rating}
          >
            {mutation.isPending ? translated.submitting : translated.submit}
          </Button>
          {submitted && (
            <Typography variant="caption" color="text.secondary">
              {translated.thanks}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default QuickRatingCard;
