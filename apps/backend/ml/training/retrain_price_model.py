from pathlib import Path

import pandas as pd

from ml.price.dataset_loader import build_price_history_dataset as load_or_generate_price_history
from ml.price.model import forecast_from_bundle, load_bundle as load_model_from_artifact
from ml.price.train import retrain_price_models, train_price_model_for_pair

DEFAULT_PAIRS = [
    ("rice", "patna"),
    ("rice", "pune"),
    ("wheat", "patna"),
    ("wheat", "lucknow"),
    ("maize", "nagpur"),
    ("mustard", "jaipur"),
]


def predict_future(model, periods: int) -> pd.DataFrame:
    return forecast_from_bundle(model, periods=periods)


__all__ = [
    "DEFAULT_PAIRS",
    "load_model_from_artifact",
    "load_or_generate_price_history",
    "predict_future",
    "retrain_price_models",
    "train_price_model_for_pair",
]
