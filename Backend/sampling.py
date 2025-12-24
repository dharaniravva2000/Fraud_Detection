import pandas as pd


def downsample_non_fraud(train: pd.DataFrame, frac: float = 0.3, random_state: int = 42) -> pd.DataFrame:
    fraud = train[train["isFraud"] == 1]
    non_fraud = train[train["isFraud"] == 0]
    non_fraud_sampled = non_fraud.sample(frac=frac, random_state=random_state)
    train_sampled = pd.concat([fraud, non_fraud_sampled]).reset_index(drop=True)
    train_sampled = train_sampled.sample(frac=1, random_state=random_state).reset_index(drop=True)
    return train_sampled
