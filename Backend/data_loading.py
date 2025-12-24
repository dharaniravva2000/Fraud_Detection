from pathlib import Path
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent / "datasets"


def load_raw_data(data_dir: Path = DATA_DIR):
    trans_path = data_dir / "train_transaction.csv"
    id_path = data_dir / "train_identity.csv"
    train_trans = pd.read_csv(trans_path)
    train_id = pd.read_csv(id_path)
    return train_trans, train_id


def merge_datasets(train_trans: pd.DataFrame, train_id: pd.DataFrame) -> pd.DataFrame:
    return train_trans.merge(train_id, on="TransactionID", how="left")


def select_columns(train: pd.DataFrame) -> pd.DataFrame:
    columns_to_keep = [
        "TransactionID", "TransactionDT", "TransactionAmt", "ProductCD",
        "card1", "card2", "card3", "card4", "card5", "card6",
        "addr1", "addr2", "P_emaildomain", "R_emaildomain",
        "DeviceType", "DeviceInfo", "isFraud",
    ] + [col for col in train.columns if "id_" in col]
    return train[columns_to_keep]
