from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    roc_auc_score,
    roc_curve,
    auc,
)


def classification_metrics(y_true, y_pred, y_pred_proba):
    return {
        "confusion_matrix": confusion_matrix(y_true, y_pred),
        "classification_report": classification_report(y_true, y_pred),
        "roc_auc": roc_auc_score(y_true, y_pred_proba),
    }


def plot_confusion_matrices(y_true, predictions_by_model, save_path=None):
    plt.figure(figsize=(6, 8))
    for i, (name, preds) in enumerate(predictions_by_model.items()):
        cm = confusion_matrix(y_true, preds)
        plt.subplot(len(predictions_by_model), 1, i + 1)
        sns.heatmap(cm, annot=True, fmt="d", cmap="Blues")
        plt.title(f"{name} - Confusion Matrix")
        plt.xlabel("Predicted")
        plt.ylabel("Actual")
    plt.tight_layout()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_roc_curve(y_true, y_pred_proba, save_path=None):
    fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
    roc_auc = auc(fpr, tpr)
    plt.figure(figsize=(6, 5))
    plt.plot(fpr, tpr, label=f"AUC = {roc_auc:.3f}", color="darkorange")
    plt.plot([0, 1], [0, 1], "k--")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve - Stacking Classifier")
    plt.legend()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_precision_recall_thresholds(y_true, y_pred_proba, threshold, save_path=None):
    thresholds = np.linspace(0, 1, 100)
    recalls = []
    precisions = []

    for t in thresholds:
        preds = (y_pred_proba > t).astype(int)
        cm = confusion_matrix(y_true, preds)
        tp = cm[1, 1]
        fp = cm[0, 1]
        fn = cm[1, 0]
        precision_score = tp / (tp + fp + 1e-6)
        recall_score = tp / (tp + fn + 1e-6)
        recalls.append(recall_score)
        precisions.append(precision_score)

    plt.figure(figsize=(8, 5))
    plt.plot(thresholds, recalls, label="Recall", color="red")
    plt.plot(thresholds, precisions, label="Precision", color="blue")
    plt.axvline(threshold, color="green", linestyle="--", label=f"Selected Threshold = {threshold}")
    plt.xlabel("Threshold")
    plt.ylabel("Performance")
    plt.title("Precision and Recall vs Threshold (Stacking Classifier)")
    plt.legend()
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_feature_importance_xgb(xgb_model, feature_names, top_n=20, save_path=None):
    feature_imp_xgb = (
        pd.DataFrame({"Feature": feature_names, "Importance": xgb_model.feature_importances_})
        .sort_values(by="Importance", ascending=False)
        .head(top_n)
    )
    plt.figure(figsize=(10, 6))
    plt.barh(feature_imp_xgb["Feature"], feature_imp_xgb["Importance"])
    plt.gca().invert_yaxis()
    plt.title("Top 20 Most Important Features (XGBoost)")
    plt.xlabel("Importance Score")
    if save_path:
        Path(save_path).parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()
