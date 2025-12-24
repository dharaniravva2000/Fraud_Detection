import numpy as np
from sklearn.preprocessing import StandardScaler


def scale_numeric(df, scaler=None, feature_columns=None):
    df = df.copy()
    if feature_columns is None:
        features_to_scale = [
            col for col in df.select_dtypes(include=np.number).columns
            if col not in ["TransactionID", "isFraud"]
        ]
    else:
        features_to_scale = list(feature_columns)
        for col in features_to_scale:
            if col not in df.columns:
                df[col] = 0

    scaler_out = scaler or StandardScaler()
    if scaler is None:
        df[features_to_scale] = scaler_out.fit_transform(df[features_to_scale])
    else:
        df[features_to_scale] = scaler_out.transform(df[features_to_scale])
    return df, scaler_out
