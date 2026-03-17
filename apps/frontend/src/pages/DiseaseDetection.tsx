import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import AppLayout from "../components/common/AppLayout";
import { isOnline } from "../utils/offlineStorage";
import { predictDisease, queueDiseaseDetection, DiseasePrediction } from "../services/disease";
import { captureDiseaseImage, isNativePlatform } from "../services/native";

const DiseaseDetection: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DiseasePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [nativeReady] = useState(isNativePlatform());

  const [offline, setOffline] = useState(!isOnline());

  useEffect(() => {
    const handler = () => setOffline(!isOnline());
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] || null;
    setResult(null);
    setMessage(null);
    setFile(selected);
    if (selected) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      if (!isOnline()) {
        await queueDiseaseDetection(file);
        setMessage("Offline Mode - detection will run when internet is available.");
        return;
      }
      const response = await predictDisease(file);
      setResult(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to detect disease.");
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    setMessage(null);
    setResult(null);
    try {
      const capture = await captureDiseaseImage();
      if (!capture) return;
      setFile(capture.file);
      setPreviewUrl(capture.previewUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Camera capture failed.");
    }
  };

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Crop Disease Detection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload a clear leaf image to detect possible crop diseases and recommended treatments.
              </Typography>
              {offline && (
                <Alert severity="warning">Offline Mode - uploads will be queued for later detection.</Alert>
              )}
              <Box>
                <Button variant="outlined" component="label">
                  Upload Crop Image
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
                {nativeReady && (
                  <Button sx={{ ml: 2 }} variant="outlined" onClick={handleCapture}>
                    Use Camera
                  </Button>
                )}
              </Box>
              {previewUrl && (
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Crop preview"
                  sx={{ maxWidth: 360, borderRadius: 2, border: "1px solid rgba(0,0,0,0.1)" }}
                />
              )}
              <Button variant="contained" disabled={!file || loading} onClick={handleDetect}>
                {loading ? "Detecting..." : "Detect Disease"}
              </Button>
              {message && <Alert severity="info">{message}</Alert>}
            </Stack>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Detection Result
                </Typography>
                <Divider />
                <Typography variant="subtitle1">
                  Crop: <strong>{result.crop}</strong>
                </Typography>
                <Typography variant="subtitle1">
                  Disease: <strong>{result.disease}</strong>
                </Typography>
                <Typography variant="subtitle2">Confidence: {(result.confidence * 100).toFixed(1)}%</Typography>
                <Typography variant="subtitle2">Severity: {result.severity}</Typography>

                {result.advisory && (
                  <Alert severity="info">
                    {result.advisory}
                  </Alert>
                )}

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Treatment
                  </Typography>
                  <Stack spacing={0.5}>
                    {result.treatment.map((item) => (
                      <Typography key={item} variant="body2">
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Prevention
                  </Typography>
                  <Stack spacing={0.5}>
                    {result.prevention.map((item) => (
                      <Typography key={item} variant="body2">
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Organic Solutions
                  </Typography>
                  <Stack spacing={0.5}>
                    {result.organic_solutions.map((item) => (
                      <Typography key={item} variant="body2">
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Recommended Products
                  </Typography>
                  <Stack spacing={0.5}>
                    {result.recommended_products.map((item) => (
                      <Typography key={item} variant="body2">
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
                {result.clarifying_questions && result.clarifying_questions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Clarifying Questions
                    </Typography>
                    <Stack spacing={0.5}>
                      {result.clarifying_questions.map((item) => (
                        <Typography key={item} variant="body2">
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    </AppLayout>
  );
};

export default DiseaseDetection;
