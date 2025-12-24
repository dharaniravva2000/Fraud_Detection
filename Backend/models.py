from catboost import CatBoostClassifier
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.ensemble import StackingClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier


class CatBoostSklearn(CatBoostClassifier, BaseEstimator, ClassifierMixin):
    pass


def train_xgboost(X_train, y_train):
    scale_pos_weight = y_train.value_counts()[0] / y_train.value_counts()[1]
    xgb = XGBClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        objective="binary:logistic",
        eval_metric="auc",
        random_state=42,
        n_jobs=-1,
    )
    xgb.fit(X_train, y_train)
    return xgb


def train_catboost(X_train, y_train):
    class_weight = y_train.value_counts()[0] / y_train.value_counts()[1]
    cat = CatBoostSklearn(
        iterations=500,
        learning_rate=0.05,
        depth=6,
        verbose=0,
        class_weights=[1, class_weight],
        random_state=42,
    )
    cat.fit(X_train, y_train)
    return cat


def train_stacking(xgb, cat, X_train, y_train):
    stack_model = StackingClassifier(
        estimators=[("xgb", xgb), ("cat", cat)],
        final_estimator=LogisticRegression(
            solver="liblinear",
            class_weight="balanced",
            random_state=42,
        ),
        cv=5,
        n_jobs=1,
        passthrough=True,
        stack_method="predict_proba",
    )
    stack_model.fit(X_train, y_train)
    return stack_model
