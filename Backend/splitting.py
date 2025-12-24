from sklearn.model_selection import train_test_split


def time_based_split(df, test_size: float = 0.2):
    df_sorted = df.sort_values("TransactionDT")
    split_idx = int(len(df_sorted) * (1 - test_size))
    train_df = df_sorted.iloc[:split_idx]
    test_df = df_sorted.iloc[split_idx:]

    X_train = train_df.drop(["isFraud", "TransactionID"], axis=1)
    y_train = train_df["isFraud"]

    X_test = test_df.drop(["isFraud", "TransactionID"], axis=1)
    y_test = test_df["isFraud"]
    return X_train, X_test, y_train, y_test


def random_stratified_split(df, test_size: float = 0.2, random_state: int = 42):
    X = df.drop(columns=["isFraud", "TransactionID"])
    y = df["isFraud"]
    return train_test_split(X, y, test_size=test_size, stratify=y, random_state=random_state)
