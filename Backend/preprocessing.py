import numpy as np
from sklearn.preprocessing import LabelEncoder


def add_hour_feature(df):
    df = df.copy()
    df["hour"] = ((df["TransactionDT"] / 3600) % 24).astype(np.int8)
    return df


def impute_numerical(df, medians=None):
    df = df.copy()
    numerical_cols = df.select_dtypes(include=np.number).columns.tolist()
    numerical_cols = [col for col in numerical_cols if col not in ["TransactionID", "isFraud"]]
    medians_out = {} if medians is None else medians
    for col in numerical_cols:
        if medians is None:
            medians_out[col] = df[col].median()
        median_value = medians_out.get(col, df[col].median())
        if df[col].isnull().any():
            df[col] = df[col].fillna(median_value)
    return df, numerical_cols, medians_out


def fill_categorical(df):
    df = df.copy()
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    df[cat_cols] = df[cat_cols].fillna("Unknown")
    return df, cat_cols


def add_missing_indicators(df):
    df = df.copy()
    id_cols = [col for col in df.columns if "id_" in col]
    for col in id_cols:
        df[col + "_missing"] = df[col].isnull().astype("uint8")
    return df


def encode_categoricals(df, cat_cols, encoders=None):
    df = df.copy()
    encoders_out = {} if encoders is None else encoders
    for col in cat_cols:
        if encoders is None:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            encoders_out[col] = list(le.classes_)
        else:
            classes = encoders_out.get(col, [])
            mapping = {cls: idx for idx, cls in enumerate(classes)}
            df[col] = df[col].astype(str).map(mapping).fillna(-1).astype(int)
    return df, encoders_out
