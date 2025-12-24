import numpy as np


def add_amount_features(df):
    df = df.copy()
    df["TransactionAmt_log"] = np.log1p(df["TransactionAmt"])
    df["TransactionAmt_by_card1"] = df["TransactionAmt"] / df.groupby("card1")["TransactionAmt"].transform("mean")
    df["TransactionAmt_by_device"] = df["TransactionAmt"] / df.groupby("DeviceInfo")["TransactionAmt"].transform("mean")
    return df
