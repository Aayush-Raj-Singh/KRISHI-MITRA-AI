This folder stores the CNN weights for crop disease detection.

Expected file:
`plantvillage_efficientnet_b0.pt`

Replace the placeholder with the real model weights before running production inference.

Optional:
Create a `labels.json` file with either:
- Array of `["Crop", "Disease"]` pairs, or
- Array of objects like `{ "crop": "Rice", "disease": "Leaf Blight" }`
