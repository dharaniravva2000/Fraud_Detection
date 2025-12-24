from pathlib import Path
import json
from datetime import datetime
import math
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

from preprocessing import add_hour_feature, impute_numerical, fill_categorical, add_missing_indicators, encode_categoricals
from feature_engineering import add_amount_features
from scaling import scale_numeric

BASE_DIR = Path(__file__).resolve().parent
RESULTS_DIR = BASE_DIR / "results"
DATASETS_DIR = BASE_DIR / "datasets"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response


@app.errorhandler(Exception)
def handle_exception(exc):
    response = jsonify({"error": str(exc)})
    response.status_code = 500
    return response

ARTIFACTS_CACHE = None
METRICS_CACHE = None
EDA_CACHE = None
LAST_PREDICTIONS = {}


def load_artifacts():
    global ARTIFACTS_CACHE
    if ARTIFACTS_CACHE is None:
        path = RESULTS_DIR / "artifacts.joblib"
        if not path.exists():
            raise FileNotFoundError("Missing artifacts.joblib. Run run_pipeline.py to generate artifacts.")
        ARTIFACTS_CACHE = joblib.load(path)
    return ARTIFACTS_CACHE


def load_metrics():
    global METRICS_CACHE
    if METRICS_CACHE is None:
        path = RESULTS_DIR / "metrics.json"
        if not path.exists():
            raise FileNotFoundError("Missing metrics.json. Run run_pipeline.py to generate metrics.")
        METRICS_CACHE = json.loads(path.read_text())
    return METRICS_CACHE


def load_training_eda():
    global EDA_CACHE
    if EDA_CACHE is None:
        path = RESULTS_DIR / "eda_training.json"
        if not path.exists():
            raise FileNotFoundError("Missing eda_training.json. Run eda.py to generate EDA data.")
        EDA_CACHE = json.loads(path.read_text())
    return EDA_CACHE


def read_upload_files(require_transaction=True):
    merged = request.files.get("file_merged")
    transaction = request.files.get("file_transaction")
    identity = request.files.get("file_identity")

    def file_meta(file_obj, field):
        if file_obj is None:
            return None
        try:
            file_obj.stream.seek(0, 2)
            size = file_obj.stream.tell()
            file_obj.stream.seek(0)
        except Exception:
            size = None
        return {"field": field, "filename": file_obj.filename, "size_bytes": size}

    meta = {
        "files": list(filter(None, [
            file_meta(merged, "file_merged"),
            file_meta(transaction, "file_transaction"),
            file_meta(identity, "file_identity"),
        ])),
        "dataset_type": None,
    }

    if merged:
        meta["dataset_type"] = "merged"
        return pd.read_csv(merged), meta

    if transaction is None and identity is None:
        raise ValueError("Provide file_merged or file_transaction.")

    df_transaction = pd.read_csv(transaction) if transaction is not None else None
    df_identity = pd.read_csv(identity) if identity is not None else None

    if df_transaction is not None and df_identity is not None:
        meta["dataset_type"] = "merged"
        return df_transaction.merge(df_identity, on="TransactionID", how="left"), meta
    if df_transaction is not None:
        meta["dataset_type"] = "transaction"
        return df_transaction, meta
    if df_identity is not None and not require_transaction:
        meta["dataset_type"] = "identity"
        return df_identity, meta

    raise ValueError("Provide file_transaction (transaction data required for prediction).")


def select_columns_for_inference(df):
    columns_to_keep = [
        "TransactionID", "TransactionDT", "TransactionAmt", "ProductCD",
        "card1", "card2", "card3", "card4", "card5", "card6",
        "addr1", "addr2", "P_emaildomain", "R_emaildomain",
        "DeviceType", "DeviceInfo",
    ] + [col for col in df.columns if "id_" in col]
    present = [col for col in columns_to_keep if col in df.columns]
    return df[present]


def preprocess_for_inference(df, artifacts):
    df = df.copy()
    df = select_columns_for_inference(df)
    df = add_hour_feature(df)

    df, _, _ = impute_numerical(df, artifacts.get("medians"))
    df, cat_cols = fill_categorical(df)
    df = add_missing_indicators(df)
    df, _ = encode_categoricals(df, cat_cols, artifacts.get("encoders"))

    df = add_amount_features(df)
    feature_columns = artifacts.get("feature_columns", [])
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    df, _ = scale_numeric(df, artifacts.get("scaler"), feature_columns=feature_columns)
    df = df[feature_columns]
    return df


def build_schema_alignment(upload_df, artifacts):
    required = set(artifacts.get("feature_columns", []))
    present = set(upload_df.columns)
    missing_required = sorted(list(required - present))
    present_required = sorted(list(required.intersection(present)))

    created_columns = []
    for col in ["hour", "TransactionAmt_log", "TransactionAmt_by_card1", "TransactionAmt_by_device"]:
        if col not in present:
            created_columns.append(col)
    created_columns += [col for col in required if col.endswith("_missing")]

    base_columns = [
        "TransactionID", "TransactionDT", "TransactionAmt", "ProductCD",
        "card1", "card2", "card3", "card4", "card5", "card6",
        "addr1", "addr2", "P_emaildomain", "R_emaildomain",
        "DeviceType", "DeviceInfo",
    ] + [col for col in upload_df.columns if "id_" in col]
    used_raw = set(base_columns)
    ignored_columns = sorted(list(present - used_raw))

    unseen_categories = {}
    encoders = artifacts.get("encoders", {})
    for col, classes in encoders.items():
        if col in upload_df.columns:
            values = upload_df[col].astype(str).unique().tolist()
            unseen = [v for v in values if v not in classes]
            if unseen:
                unseen_categories[col] = len(unseen)

    return {
        "present_required": present_required,
        "missing_required": missing_required,
        "created_columns": sorted(list(set(created_columns))),
        "ignored_columns": ignored_columns,
        "final_feature_count": int(len(required)),
        "unseen_categories": unseen_categories or None,
    }


@app.route("/api/v1/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/api/v1/models", methods=["GET"])
def models():
    trained_at = None
    try:
        metrics_data = load_metrics()
        trained_at = metrics_data.get("xgb", {}).get("training_stats", {}).get("trained_at")
    except Exception:
        trained_at = datetime.utcnow().isoformat()
    payload = {
        "models": [
            {
                "key": "xgb",
                "name": "XGBoost",
                "trained_at": trained_at or datetime.utcnow().isoformat(),
                "supports_threshold": False,
                "supports_explain": True,
            },
            {
                "key": "cat",
                "name": "CatBoost",
                "trained_at": trained_at or datetime.utcnow().isoformat(),
                "supports_threshold": False,
                "supports_explain": True,
            },
            {
                "key": "stack",
                "name": "Stacking",
                "trained_at": trained_at or datetime.utcnow().isoformat(),
                "supports_threshold": True,
                "supports_explain": True,
            },
        ]
    }
    return jsonify(payload)


@app.route("/api/v1/metrics", methods=["GET"])
def metrics():
    model_key = request.args.get("model", "xgb")
    metrics_data = load_metrics()
    if model_key not in metrics_data:
        return jsonify({"error": f"Unknown model: {model_key}"}), 404
    return jsonify(metrics_data[model_key])


@app.route("/api/v1/eda/training", methods=["GET"])
def training_eda():
    return jsonify(load_training_eda())


@app.route("/api/v1/predict", methods=["POST"])
def predict():
    model_key = request.form.get("model", "xgb")
    threshold = float(request.form.get("threshold", 0.5))

    artifacts = load_artifacts()
    models = artifacts.get("models", {})
    model = models.get(model_key)
    if model is None:
        return jsonify({"error": f"Model not available: {model_key}"}), 404

    try:
        df, _ = read_upload_files(require_transaction=True)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    transaction_ids = df["TransactionID"].astype(str).tolist() if "TransactionID" in df.columns else None
    X = preprocess_for_inference(df, artifacts)
    proba = model.predict_proba(X)[:, 1]

    if model_key != "stack":
        threshold = 0.5
    preds = (proba > threshold).astype(int)

    rows = []
    for idx, p in enumerate(proba):
        rows.append({
            "row_id": str(idx),
            "TransactionID": transaction_ids[idx] if transaction_ids else None,
            "proba": float(p),
            "pred_label": int(preds[idx]),
        })

    summary = {
        "total": int(len(rows)),
        "fraud_count": int(preds.sum()),
        "non_fraud_count": int((preds == 0).sum()),
        "fraud_rate": float(preds.mean()) if len(preds) else 0.0,
        "threshold": threshold,
        "model": model_key,
    }

    LAST_PREDICTIONS.clear()
    LAST_PREDICTIONS.update({
        "rows": rows,
        "features": X,
        "model": model_key,
        "raw": df,
    })

    return jsonify({"summary": summary, "rows": rows})


@app.route("/api/v1/explain", methods=["POST"])
def explain():
    data = request.get_json() or {}
    model_key = data.get("model", "xgb")
    row_ids = data.get("row_ids", [])
    top_k = int(data.get("top_k", 8))

    if not LAST_PREDICTIONS:
        return jsonify({"error": "No predictions available. Run /predict first."}), 400

    metrics_data = load_metrics().get(model_key) or {}
    importance = metrics_data.get("feature_importance") or []
    importance_map = {item["feature"]: item["importance"] for item in importance}

    def categorize(feature):
        if feature.startswith("card"):
            return "Card profile"
        if feature.startswith("addr"):
            return "Address"
        if feature in {"P_emaildomain", "R_emaildomain"}:
            return "Email domain"
        if feature in {"DeviceType", "DeviceInfo"}:
            return "Device"
        if feature in {"TransactionAmt", "TransactionAmt_log", "TransactionAmt_by_card1", "TransactionAmt_by_device"}:
            return "Amount"
        if feature in {"TransactionDT", "hour"}:
            return "Time"
        if feature.startswith("id_"):
            return "Identity"
        return "Other"

    explanations = []
    features_df = LAST_PREDICTIONS.get("features")
    raw_df = LAST_PREDICTIONS.get("raw")
    if features_df is None or raw_df is None:
        return jsonify({"error": "Prediction cache missing. Run /predict again."}), 400
    for row_id in row_ids:
        idx = int(row_id)
        if idx < 0 or idx >= len(features_df):
            continue
        row = features_df.iloc[idx]
        contributions = []
        for feature, value in row.items():
            val = 0.0 if pd.isna(value) else float(value)
            weight = importance_map.get(feature)
            score = val * float(weight) if weight is not None else val
            contributions.append((feature, score))
        positives = sorted([c for c in contributions if c[1] > 0], key=lambda x: x[1], reverse=True)[:top_k]
        negatives = sorted([c for c in contributions if c[1] < 0], key=lambda x: x[1])[:top_k]
        positives = [{"feature": f, "value": v} for f, v in positives]
        negatives = [{"feature": f, "value": v} for f, v in negatives]

        category_scores = {}
        total_abs = 0.0
        for feature, score in contributions:
            cat = categorize(feature)
            abs_score = abs(score)
            total_abs += abs_score
            category_scores[cat] = category_scores.get(cat, 0.0) + abs_score
        category_breakdown = [
            {"category": k, "percentage": (v / total_abs) * 100 if total_abs else 0.0}
            for k, v in sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
        ][:5]

        raw_row = raw_df.iloc[idx]
        simple_fields = []
        def normalize_value(val):
            if pd.isna(val):
                return None
            try:
                return val.item()
            except AttributeError:
                return val

        def add_simple(label, value, category_key):
            pct = next((c["percentage"] for c in category_breakdown if c["category"] == category_key), 0.0)
            simple_fields.append({"label": label, "value": normalize_value(value), "percentage": float(pct)})

        if raw_row is not None:
            add_simple("Transaction Amount", raw_row.get("TransactionAmt", None), "Amount")
            add_simple("Card Type", raw_row.get("card4", None), "Card profile")
            add_simple("Device Type", raw_row.get("DeviceType", None), "Device")
            add_simple("Device Info", raw_row.get("DeviceInfo", None), "Device")
            add_simple("Email Domain", raw_row.get("P_emaildomain", None), "Email domain")
            add_simple("Address", raw_row.get("addr1", None), "Address")
            add_simple("Hour", raw_row.get("hour", None), "Time")
        pred_row = next((r for r in LAST_PREDICTIONS["rows"] if r["row_id"] == row_id), None)
        explanations.append({
            "row_id": row_id,
            "proba": pred_row["proba"] if pred_row else 0.0,
            "pred_label": pred_row["pred_label"] if pred_row else 0,
            "positives": positives,
            "negatives": negatives,
            "category_breakdown": category_breakdown,
            "simple_fields": simple_fields,
        })

    return jsonify({"explanations": explanations})


@app.route("/api/v1/eda/upload", methods=["POST"])
def upload_eda():
    try:
        df, meta = read_upload_files(require_transaction=False)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400

    artifacts = load_artifacts()
    rows = int(df.shape[0])
    cols = int(df.shape[1])
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    binary_cols = [col for col in df.columns if df[col].nunique(dropna=True) <= 2]

    summary = {
        "rows": rows,
        "columns": cols,
        "numeric_columns": int(len(numeric_cols)),
        "categorical_columns": int(len(categorical_cols)),
        "binary_columns": int(len(binary_cols)),
        "transaction_id_present": "TransactionID" in df.columns,
        "dataset_type": meta.get("dataset_type"),
        "upload_timestamp": datetime.utcnow().isoformat(),
        "file_size_bytes": int(sum(f.get("size_bytes") or 0 for f in meta.get("files", []))),
        "files": meta.get("files", []),
    }

    total_cells = rows * cols if rows and cols else 0
    total_missing = int(df.isnull().sum().sum())
    overall_missing_pct = (total_missing / total_cells) * 100 if total_cells else 0.0
    rows_with_missing_pct = float(df.isnull().any(axis=1).mean() * 100) if rows else 0.0

    missing_counts = df.isnull().sum().sort_values(ascending=False)
    missingness = (
        missing_counts.head(20)
        .reset_index()
        .rename(columns={"index": "feature", 0: "missing"})
    )
    missingness["missing_pct"] = (missingness["missing"] / rows * 100) if rows else 0.0

    def cat_distribution(series, top=10):
        counts = series.dropna().astype(str).value_counts().head(top)
        return [{"label": idx, "value": int(val)} for idx, val in counts.items()]

    distributions = {}
    if "TransactionAmt" in df.columns:
        transaction_amount = df["TransactionAmt"].dropna()
        hist = transaction_amount.value_counts(bins=20).sort_index()
        distributions["transaction_amount"] = [
            {"label": f"{interval.left:.2f}-{interval.right:.2f}", "value": int(count)}
            for interval, count in hist.items()
        ]
        log_vals = transaction_amount.apply(lambda v: math.log1p(v) if v > 0 else 0)
        hist_log = log_vals.value_counts(bins=20).sort_index()
        distributions["transaction_amount_log"] = [
            {"label": f"{interval.left:.2f}-{interval.right:.2f}", "value": int(count)}
            for interval, count in hist_log.items()
        ]

    if "TransactionDT" in df.columns:
        numeric_dt = pd.to_numeric(df["TransactionDT"], errors="coerce")
        hour_series = ((numeric_dt / 3600) % 24).round(0)
        distributions["hour"] = cat_distribution(hour_series, top=24)
    elif "hour" in df.columns:
        distributions["hour"] = cat_distribution(df["hour"], top=24)

    for col, key in [
        ("ProductCD", "product_cd"),
        ("DeviceType", "device_type"),
        ("card4", "card4"),
        ("P_emaildomain", "email_domain"),
    ]:
        if col in df.columns:
            distributions[key] = cat_distribution(df[col], top=10)

    def numeric_stats(series):
        clean = series.dropna()
        if clean.empty:
            return None
        q1 = clean.quantile(0.25)
        q3 = clean.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr
        return {
            "min": float(clean.min()),
            "max": float(clean.max()),
            "mean": float(clean.mean()),
            "median": float(clean.median()),
            "std": float(clean.std()),
            "outliers": int(((clean < lower) | (clean > upper)).sum()),
        }

    stats = {}
    for col in ["TransactionAmt", "hour", "card1", "addr1"]:
        if col in df.columns:
            stats[col] = numeric_stats(df[col])

    id_cols = [col for col in df.columns if col.startswith("id_")]
    identity_analysis = None
    if id_cols:
        id_missing = df[id_cols].isnull().sum().sum()
        id_total = len(id_cols) * rows if rows else 0
        rows_with_many_missing = int((df[id_cols].isnull().sum(axis=1) >= 5).sum()) if rows else 0
        identity_analysis = {
            "id_columns_present": len(id_cols),
            "id_missing_percent": (id_missing / id_total) * 100 if id_total else 0.0,
            "rows_with_many_missing_ids": rows_with_many_missing,
        }

    duplicates = None
    if "TransactionID" in df.columns:
        duplicates = {"transaction_id_duplicates": int(df["TransactionID"].duplicated().sum())}

    schema_alignment = build_schema_alignment(df, artifacts)

    warnings = []
    if identity_analysis and identity_analysis["id_missing_percent"] > 30:
        warnings.append("Identity features are heavily missing; risk signals may be weaker.")
    if overall_missing_pct > 20:
        warnings.append("High overall missingness detected; results may be less reliable.")
    if "TransactionDT" not in df.columns:
        warnings.append("TransactionDT missing; hour feature may be imputed or unavailable.")

    return jsonify({
        "summary": summary,
        "missingness": {
            "overall_missing_pct": overall_missing_pct,
            "rows_with_missing_pct": rows_with_missing_pct,
            "top": missingness.to_dict(orient="records"),
        },
        "type_breakdown": {
            "numeric": len(numeric_cols),
            "categorical": len(categorical_cols),
            "binary": len(binary_cols),
        },
        "stats": stats,
        "distributions": distributions,
        "identity_analysis": identity_analysis,
        "schema_alignment": schema_alignment,
        "duplicates": duplicates,
        "warnings": warnings,
    })


if __name__ == "__main__":
    import os

    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
