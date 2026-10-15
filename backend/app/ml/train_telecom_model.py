import csv
import os
import sys
from pathlib import Path
# pyrefly: ignore [missing-import]
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from sklearn.model_selection import StratifiedKFold, cross_val_predict

CURRENT_DIR = Path(__file__).resolve().parent
DATASET_PATH = CURRENT_DIR / "telecom_dataset.csv"
MODEL_PATH = CURRENT_DIR / "telecom_intent_model.joblib"


def load_dataset(csv_path: Path):
    texts = []
    intents = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            text = (row.get("text") or "").strip()
            intent = (row.get("intent") or "").strip()
            if text and intent:
                texts.append(text)
                intents.append(intent)
    return texts, intents


def train_and_save_model():
    print(f"Loading dataset from: {DATASET_PATH}")
    texts, intents = load_dataset(DATASET_PATH)
    print(f"Loaded {len(texts)} samples across {len(set(intents))} unique intents.")

    # Build Pipeline with char_wb + word n-grams for typo-resistance and Amharic agglutinative morphology
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                ngram_range=(2, 5),
                analyzer="char_wb",
                sublinear_tf=True,
                min_df=1,
            ),
        ),
        (
            "clf",
            LogisticRegression(
                C=2.0,
                max_iter=1000,
                class_weight="balanced",
                random_state=42,
            ),
        ),
    ])

    print("Evaluating with Stratified K-Fold Cross Validation...")
    cv = StratifiedKFold(n_splits=4, shuffle=True, random_state=42)
    y_pred = cross_val_predict(pipeline, texts, intents, cv=cv)
    print("\nClassification Report:")
    print(classification_report(intents, y_pred))

    print("Fitting model on complete dataset...")
    pipeline.fit(texts, intents)

    print(f"Saving trained model to: {MODEL_PATH}")
    joblib.dump(pipeline, MODEL_PATH)
    print("Telecom Intent Classification Model trained and exported successfully!")


if __name__ == "__main__":
    train_and_save_model()
