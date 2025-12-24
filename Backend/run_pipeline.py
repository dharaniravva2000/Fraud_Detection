from pathlib import Path
import json
from datetime import datetime
import joblib
from sklearn.metrics import (
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    precision_recall_fscore_support,
    average_precision_score,
)
from data_loading import load_raw_data, merge_datasets, select_columns
from sampling import downsample_non_fraud
from preprocessing import (
    add_hour_feature,
    impute_numerical,
    fill_categorical,
    add_missing_indicators,
    encode_categoricals,
)
from feature_engineering import add_amount_features
from scaling import scale_numeric
from splitting import random_stratified_split
from models import train_xgboost, train_catboost, train_stacking
from evaluation import (
    classification_metrics,
    plot_confusion_matrices,
    plot_roc_curve,
    plot_precision_recall_thresholds,
    plot_feature_importance_xgb,
)


def run_pipeline(threshold=0.3, run_plots=False, results_dir=None):
    train_trans, train_id = load_raw_data()
    train = merge_datasets(train_trans, train_id)
    train = select_columns(train)

    train_sampled = downsample_non_fraud(train)
    train_sampled = add_hour_feature(train_sampled)

    train_sampled, _, medians = impute_numerical(train_sampled)
    train_sampled, cat_cols = fill_categorical(train_sampled)
    train_sampled = add_missing_indicators(train_sampled)
    train_sampled, encoders = encode_categoricals(train_sampled, cat_cols)

    train_sampled = add_amount_features(train_sampled)
    train_sampled, scaler = scale_numeric(train_sampled)

    X_train, X_test, y_train, y_test = random_stratified_split(train_sampled)

    xgb = train_xgboost(X_train, y_train)
    cat = train_catboost(X_train, y_train)

    y_pred_xgb = xgb.predict(X_test)
    y_pred_xgb_proba = xgb.predict_proba(X_test)[:, 1]

    y_pred_cat = cat.predict(X_test)
    y_pred_cat_proba = cat.predict_proba(X_test)[:, 1]

    metrics_xgb = classification_metrics(y_test, y_pred_xgb, y_pred_xgb_proba)
    metrics_cat = classification_metrics(y_test, y_pred_cat, y_pred_cat_proba)

    metrics_stack = None
    stack_model = None
    try:
        stack_model = train_stacking(xgb, cat, X_train, y_train)
        y_pred_proba = stack_model.predict_proba(X_test)[:, 1]
        y_pred = (y_pred_proba > threshold).astype(int)
        metrics_stack = classification_metrics(y_test, y_pred, y_pred_proba)
    except Exception as exc:
        print(f"Stacking model skipped due to error: {exc}")

    results_path = Path(results_dir) if results_dir else Path(__file__).resolve().parent / "results"
    results_path.mkdir(parents=True, exist_ok=True)

    if run_plots:
        preds_by_model = {"XGBoost": y_pred_xgb, "CatBoost": y_pred_cat}
        if metrics_stack is not None:
            preds_by_model["Stacking"] = y_pred
        plot_confusion_matrices(
            y_test,
            preds_by_model,
            results_path / "confusion_matrices.png",
        )
        if metrics_stack is not None:
            plot_roc_curve(y_test, y_pred_proba, results_path / "roc_curve.png")
            plot_precision_recall_thresholds(
                y_test,
                y_pred_proba,
                threshold,
                results_path / "precision_recall_thresholds.png",
            )
        plot_feature_importance_xgb(
            xgb,
            X_train.columns,
            save_path=results_path / "xgb_feature_importance.png",
        )

    artifacts = {
        "models": {"xgb": xgb, "cat": cat, "stack": stack_model if metrics_stack is not None else None},
        "scaler": scaler,
        "encoders": encoders,
        "medians": medians,
        "cat_cols": cat_cols,
        "feature_columns": list(X_train.columns),
    }
    joblib.dump(artifacts, results_path / "artifacts.joblib")

    def metrics_payload(name, y_true, preds, proba, model_obj):
        tn, fp, fn, tp = confusion_matrix(y_true, preds).ravel()
        roc = roc_curve(y_true, proba)
        pr = precision_recall_curve(y_true, proba)
        feature_importance = None
        if hasattr(model_obj, "feature_importances_"):
            feature_importance = [
                {"feature": f, "importance": float(v)}
                for f, v in sorted(
                    zip(X_train.columns, model_obj.feature_importances_),
                    key=lambda x: x[1],
                    reverse=True,
                )[:20]
            ]
        metric_obj = metrics_xgb if name == "xgb" else metrics_cat if name == "cat" else metrics_stack
        precision_val, recall_val, f1_val, _ = precision_recall_fscore_support(
            y_true, preds, average="binary"
        )
        pr_auc = float(average_precision_score(y_true, proba))
        return {
            "metrics": {
                "roc_auc": float(metric_obj["roc_auc"]),
                "pr_auc": pr_auc,
                "precision": precision_val,
                "recall": recall_val,
                "f1": f1_val,
            },
            "curves": {
                "roc": {"fpr": roc[0].tolist(), "tpr": roc[1].tolist()},
                "pr": {"precision": pr[0].tolist(), "recall": pr[1].tolist()},
            },
            "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
            "feature_importance": feature_importance,
        }

    metrics_bundle = {
        "xgb": metrics_payload("xgb", y_test, y_pred_xgb, y_pred_xgb_proba, xgb),
        "cat": metrics_payload("cat", y_test, y_pred_cat, y_pred_cat_proba, cat),
    }
    if metrics_stack is not None:
        metrics_bundle["stack"] = metrics_payload("stack", y_test, y_pred, y_pred_proba, stack_model)

    training_stats = {
        "fraud_rate": float(train_sampled["isFraud"].mean()),
        "dataset_sizes": {
            "total": int(len(train_sampled)),
            "fraud": int((train_sampled["isFraud"] == 1).sum()),
            "non_fraud": int((train_sampled["isFraud"] == 0).sum()),
        },
        "sampling_ratio": float((train_sampled["isFraud"] == 0).mean()),
        "trained_at": datetime.utcnow().isoformat(),
    }

    metrics_payloads = {
        model_key: {**payload, "training_stats": training_stats}
        for model_key, payload in metrics_bundle.items()
    }
    with open(results_path / "metrics.json", "w") as f:
        json.dump(metrics_payloads, f)

    return {
        "xgb": metrics_xgb,
        "cat": metrics_cat,
        "stack": metrics_stack,
    }


if __name__ == "__main__":
    results = run_pipeline(run_plots=True)
    for name, metrics in results.items():
        if metrics is None:
            print(f"{name.upper()} skipped")
            continue
        print(f"{name.upper()} ROC-AUC: {metrics['roc_auc']:.4f}")
