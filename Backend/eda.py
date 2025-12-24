from pathlib import Path
import json
import matplotlib.pyplot as plt
import seaborn as sns

DEFAULT_PLOTS_DIR = Path(__file__).resolve().parent / "plots"


def plot_class_balance(train, save_path=None):
    plt.figure(figsize=(6, 4))
    sns.countplot(x="isFraud", data=train)
    plt.title("Non-Fraud Transactions vs Fraud")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_sampled_balance(train_sampled, save_path_prefix=None):
    plt.figure(figsize=(6, 4))
    sns.countplot(x="isFraud", data=train_sampled, palette=["green", "red"])
    plt.title("Count of Fraud vs Non-Fraud Transactions (Sample)")
    plt.xlabel("Transaction Type")
    plt.ylabel("Number of Transactions")
    plt.xticks([0, 1], ["Non-Fraud (0)", "Fraud (1)"])
    for i, v in enumerate(train_sampled["isFraud"].value_counts().sort_index()):
        plt.text(i, v + 50, str(v), ha="center", fontweight="bold")
    if save_path_prefix:
        plt.savefig(f"{save_path_prefix}_count.png", bbox_inches="tight")
    plt.close()

    fraud_percent = train_sampled["isFraud"].value_counts(normalize=True) * 100
    plt.figure(figsize=(6, 4))
    sns.barplot(x=fraud_percent.index, y=fraud_percent.values, palette=["green", "red"])
    plt.title("Fraud vs Non-Fraud Percentage (Sample)")
    plt.xlabel("Transaction Type")
    plt.ylabel("Percentage (%)")
    plt.xticks([0, 1], ["Non-Fraud (0)", "Fraud (1)"])
    for i, v in enumerate(fraud_percent.values):
        plt.text(i, v + 0.5, f"{v:.2f}%", ha="center", fontweight="bold")
    if save_path_prefix:
        plt.savefig(f"{save_path_prefix}_percent.png", bbox_inches="tight")
    plt.close()


def plot_transaction_amount(train_sampled, save_path=None):
    plt.figure(figsize=(10, 5))
    sns.histplot(
        data=train_sampled,
        x="TransactionAmt",
        hue="isFraud",
        bins=100,
        log_scale=True,
        palette=["green", "red"],
    )
    plt.title("Transaction Amount Distribution: Fraud vs Non-Fraud")
    plt.xlabel("Transaction Amount (log scale)")
    plt.ylabel("Count")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_productcd(train_sampled, save_path=None):
    plt.figure(figsize=(8, 5))
    sns.countplot(data=train_sampled, x="ProductCD", hue="isFraud", palette=["green", "red"])
    plt.title("Fraud Count by ProductCD")
    plt.xlabel("Product Code")
    plt.ylabel("Number of Transactions")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_email_fraud(train_sampled, save_path=None):
    email_fraud = train_sampled.groupby("P_emaildomain")["isFraud"].mean().sort_values(ascending=False) * 100
    plt.figure(figsize=(12, 5))
    sns.barplot(x=email_fraud.index, y=email_fraud.values, palette="coolwarm")
    plt.title("Fraud Percentage by P_emaildomain")
    plt.ylabel("Fraud Percentage (%)")
    plt.xlabel("Primary Email Domain")
    plt.xticks(rotation=45)
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_hourly_fraud(train_sampled, save_path=None):
    hourly_fraud = train_sampled.groupby("hour")["isFraud"].mean() * 100
    plt.figure(figsize=(12, 5))
    sns.lineplot(x=hourly_fraud.index, y=hourly_fraud.values, marker="o")
    plt.title("Fraud Percentage by Hour of Day")
    plt.xlabel("Hour of Day")
    plt.ylabel("Fraud Percentage (%)")
    plt.xticks(range(0, 24))
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_device_fraud(train_sampled, save_path=None):
    device_fraud = train_sampled.groupby("DeviceType")["isFraud"].mean() * 100
    plt.figure(figsize=(6, 4))
    sns.barplot(x=device_fraud.index, y=device_fraud.values, palette="Blues")
    plt.title("Fraud Percentage by Device Type")
    plt.ylabel("Fraud Percentage (%)")
    plt.xlabel("Device Type")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def plot_correlation_heatmap(train_sampled, num_cols, save_path=None):
    plt.figure(figsize=(10, 8))
    sns.heatmap(train_sampled[num_cols + ["isFraud"]].corr(), annot=True, fmt=".2f", cmap="coolwarm")
    plt.title("Correlation Heatmap of Numerical Features with isFraud")
    if save_path:
        plt.savefig(save_path, bbox_inches="tight")
    plt.close()


def save_all_eda_plots(train, train_sampled, num_cols, plots_dir=DEFAULT_PLOTS_DIR):
    plots_dir.mkdir(parents=True, exist_ok=True)
    plot_class_balance(train, plots_dir / "class_balance.png")
    plot_sampled_balance(train_sampled, plots_dir / "sampled_balance")
    plot_transaction_amount(train_sampled, plots_dir / "transaction_amount.png")
    plot_productcd(train_sampled, plots_dir / "productcd.png")
    plot_email_fraud(train_sampled, plots_dir / "email_fraud.png")
    plot_hourly_fraud(train_sampled, plots_dir / "hourly_fraud.png")
    plot_device_fraud(train_sampled, plots_dir / "device_fraud.png")
    plot_correlation_heatmap(train_sampled, num_cols, plots_dir / "correlation_heatmap.png")


def build_training_eda_json(train_sampled_raw, results_dir):
    missingness = (
        train_sampled_raw.isnull().sum().sort_values(ascending=False).head(20).reset_index()
    )
    missingness.columns = ["feature", "missing"]
    transaction_amount = (
        train_sampled_raw["TransactionAmt"]
        .dropna()
        .pipe(lambda s: s[s <= s.quantile(0.99)])
    )
    hist = transaction_amount.value_counts(bins=20).sort_index()
    distribution = [
        {"bin": f"{interval.left:.2f}-{interval.right:.2f}", "count": int(count)}
        for interval, count in hist.items()
    ]
    fraud_by_hour = (
        train_sampled_raw.groupby("hour")["isFraud"].mean().reset_index()
        if "hour" in train_sampled_raw.columns
        else []
    )
    payload = {
        "missingness": missingness.to_dict(orient="records"),
        "distributions": {"transaction_amount": distribution},
        "fraud_by_hour": [
            {"hour": int(row["hour"]), "fraud_rate": float(row["isFraud"])}
            for _, row in fraud_by_hour.iterrows()
        ]
        if hasattr(fraud_by_hour, "iterrows")
        else [],
    }
    results_dir.mkdir(parents=True, exist_ok=True)
    with open(results_dir / "eda_training.json", "w") as f:
        json.dump(payload, f)
    return payload


if __name__ == "__main__":
    from data_loading import load_raw_data, merge_datasets, select_columns
    from sampling import downsample_non_fraud
    from preprocessing import add_hour_feature, impute_numerical

    train_trans, train_id = load_raw_data()
    train = merge_datasets(train_trans, train_id)
    train = select_columns(train)

    train_sampled_raw = downsample_non_fraud(train)
    train_sampled_raw = add_hour_feature(train_sampled_raw)
    train_sampled, num_cols, _ = impute_numerical(train_sampled_raw)

    save_all_eda_plots(train, train_sampled, num_cols)
    results_dir = Path(__file__).resolve().parent / "results"
    build_training_eda_json(train_sampled_raw, results_dir)
    print(f"Saved EDA plots to {DEFAULT_PLOTS_DIR} and JSON to {results_dir}")
