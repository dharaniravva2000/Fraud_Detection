export type HealthResponse = { status: string };

export type ModelInfo = {
  key: string;
  name: string;
  trained_at: string;
  supports_threshold: boolean;
  supports_explain: boolean;
};

export type ModelsResponse = {
  models: ModelInfo[];
};

export type MetricSet = {
  roc_auc?: number;
  pr_auc?: number;
  precision?: number;
  recall?: number;
  f1?: number;
};

export type MetricsResponse = {
  metrics: MetricSet;
  curves?: {
    roc?: { fpr: number[]; tpr: number[] };
    pr?: { precision: number[]; recall: number[] };
  };
  confusion_matrix?: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  feature_importance?: { feature: string; importance: number }[];
  training_stats?: {
    fraud_rate?: number;
    dataset_sizes?: { total: number; fraud: number; non_fraud: number };
    sampling_ratio?: number;
    trained_at?: string;
  };
};

export type EdaTrainingResponse = {
  charts_data?: Record<string, unknown>;
  missingness?: { feature: string; missing: number }[];
  distributions?: {
    transaction_amount?: { bin: string; count: number }[];
  };
  fraud_by_hour?: { hour: number; fraud_rate: number }[];
};

export type PredictResponse = {
  summary: {
    total: number;
    fraud_count: number;
    non_fraud_count: number;
    fraud_rate: number;
    threshold?: number;
    model: string;
  };
  rows: {
    row_id: string;
    TransactionID?: string | number;
    proba: number;
    pred_label: string | number;
  }[];
  download_token?: string;
};

export type ExplainResponse = {
  explanations: {
    row_id: string;
    proba: number;
    pred_label: string | number;
    positives: { feature: string; value: number }[];
    negatives: { feature: string; value: number }[];
    category_breakdown?: { category: string; percentage: number }[];
    simple_fields?: { label: string; value: string | number | null; percentage: number }[];
  }[];
};

export type UploadEdaResponse = {
  summary: {
    rows: number;
    columns: number;
    numeric_columns: number;
    categorical_columns: number;
    binary_columns: number;
    transaction_id_present: boolean;
    dataset_type: string | null;
    upload_timestamp: string;
    file_size_bytes: number;
    files: { field: string; filename: string; size_bytes: number | null }[];
  };
  missingness?: {
    overall_missing_pct: number;
    rows_with_missing_pct: number;
    top: { feature: string; missing: number; missing_pct: number }[];
  };
  type_breakdown?: {
    numeric: number;
    categorical: number;
    binary: number;
  };
  stats?: Record<string, { min: number; max: number; mean: number; median: number; std: number; outliers: number } | null>;
  distributions?: Record<string, { label: string; value: number }[]>;
  identity_analysis?: {
    id_columns_present: number;
    id_missing_percent: number;
    rows_with_many_missing_ids: number;
  } | null;
  schema_alignment?: {
    present_required: string[];
    missing_required: string[];
    created_columns: string[];
    ignored_columns: string[];
    final_feature_count: number;
    unseen_categories?: Record<string, number> | null;
  };
  duplicates?: { transaction_id_duplicates: number } | null;
  warnings?: string[];
};
