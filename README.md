# Fraud Detection ML Dashboard — Setup & Usage

This repository contains:
- `Backend/` — Python ML pipeline + Flask API for metrics, EDA, prediction, explain
- `frontend/` — React + Vite + TypeScript dashboard

This guide includes **every command you need**, from clean setup to running the full system.

---

## ✅ 1) Backend Setup (Python)

From the project root:

```bash
cd /Users/ravvadharani/Desktop/dissertation
```

### Create/activate venv (Python 3.11 already used)

```bash
python3.11 -m venv Backend/.venv311
source Backend/.venv311/bin/activate
```

### Install dependencies

```bash
pip install -r Backend/requirements.txt
```

---

## ✅ 2) Generate ML Artifacts (Required once)

These commands create the trained models + metrics JSON + EDA JSON used by the API.

```bash
python Backend/run_pipeline.py
python Backend/eda.py
```

Outputs created:
- `Backend/results/artifacts.joblib`
- `Backend/results/metrics.json`
- `Backend/results/eda_training.json`

---

## ✅ 3) Start Flask API

Run on port **5001** (since 5000 was busy):

```bash
PORT=5001 python Backend/api_app.py
```

Test API:

```bash
curl http://localhost:5001/api/v1/health
```

Should return:
```json
{"status":"ok"}
```

---

## ✅ 4) Frontend Setup (React)

Open a new terminal:

```bash
cd /Users/ravvadharani/Desktop/dissertation/frontend
npm install
npm run dev
```

Frontend runs at:
```
http://localhost:5174
```

The frontend uses `.env`:
```
VITE_API_BASE_URL=http://localhost:5001
```

---

## ✅ Key Features (What each page does)

### **Overview**
- Shows model metrics, ROC/PR curves, feature importance
- Shows EDA (fraud by hour, missingness, amount distribution)
- Model justification (weighted score)

### **Upload & Predict**
- Upload CSVs (merged/transaction/identity)
- Choose model
- Threshold only for stacking
- Output fraud predictions
- “View reason” shows simple explanation (device/card/amount etc)

### **Analysis Report**
After upload, shows:
- Dataset overview (rows, columns, dataset type)
- Schema alignment (missing/created/ignored columns)
- Missingness analysis
- Numeric summary stats
- Distribution plots
- Identity analysis (if id_* present)
- Data quality warnings

### **Models**
Compare model metrics + set default model

---

## ✅ Troubleshooting

### Port already in use
Use:
```bash
PORT=5001 python Backend/api_app.py
```

### API not reachable
Check:
```bash
curl http://localhost:5001/api/v1/health
```

### CORS errors
Make sure Flask is restarted after changes:
```bash
PORT=5001 python Backend/api_app.py
```

### Prediction or EDA errors
Check backend terminal for error text and fix based on message.

---

## ✅ Quick Start (copy/paste)

```bash
cd /Users/ravvadharani/Desktop/dissertation
source Backend/.venv311/bin/activate
pip install -r Backend/requirements.txt
python Backend/run_pipeline.py
python Backend/eda.py
PORT=5001 python Backend/api_app.py
```

In a second terminal:

```bash
cd /Users/ravvadharani/Desktop/dissertation/frontend
npm install
npm run dev
```

Open:
```
http://localhost:5174
```
