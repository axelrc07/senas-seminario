# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
"""
predict_server.py — Servidor Flask para prediccion ASL en tiempo real.
Acepta imágenes en base64 via POST /predict y retorna la letra ASL detectada con confianza.
Ejecutar con: python predict_server.py
"""

import os
import sys
import csv
import copy
import base64
import itertools

import cv2 as cv
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from mediapipe.tasks.python.vision import HandLandmarkerOptions

from model.keypoint_classifier.keypoint_classifier import KeyPointClassifier

app = Flask(__name__)
CORS(app)

# ─── Cargar labels ──────────────────────────────────────────────────────────
LABELS_PATH = os.path.join(os.path.dirname(__file__), "model/keypoint_classifier/keypoint_classifier_label.csv")
with open(LABELS_PATH, encoding="utf-8-sig") as f:
    LABELS = [row[0] for row in csv.reader(f)]

# ─── Clases wrapper para MediaPipe 0.10+ ────────────────────────────────────
class _FakeLandmark:
    def __init__(self, x, y, z):
        self.x, self.y, self.z = x, y, z

class _FakeHandLandmarks:
    def __init__(self, landmarks_list):
        self.landmark = landmarks_list

class _FakeHandedness:
    def __init__(self, label):
        self.classification = [type('C', (), {'label': label})()]

class _WrappedResults:
    def __init__(self, multi_hand_landmarks, multi_handedness):
        self.multi_hand_landmarks = multi_hand_landmarks or None
        self.multi_handedness = multi_handedness or None

def _wrap_results(raw):
    if not raw.hand_landmarks:
        return _WrappedResults(None, None)
    mhl, mhd = [], []
    for lm_list, handedness_list in zip(raw.hand_landmarks, raw.handedness):
        mhl.append(_FakeHandLandmarks([_FakeLandmark(lm.x, lm.y, lm.z) for lm in lm_list]))
        mhd.append(_FakeHandedness(handedness_list[0].category_name))
    return _WrappedResults(mhl, mhd)

# ─── Inicializar MediaPipe ───────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
base_opts = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
opts = HandLandmarkerOptions(
    base_options=base_opts,
    running_mode=mp_vision.RunningMode.IMAGE,
    num_hands=1,
    min_hand_detection_confidence=0.5,
    min_tracking_confidence=0.5,
)
detector = mp_vision.HandLandmarker.create_from_options(opts)

# ─── Inicializar clasificador ────────────────────────────────────────────────
classifier_path = os.path.join(os.path.dirname(__file__), "model/keypoint_classifier/keypoint_classifier.tflite")
keypoint_classifier = KeyPointClassifier(model_path=classifier_path)

# Importar _Interpreter para obtener probabilidades raw
try:
    import tflite_runtime.interpreter as tflite
    _Interpreter = tflite.Interpreter
except ImportError:
    try:
        from tensorflow.lite.python.interpreter import Interpreter as _Interpreter
    except ImportError:
        import tensorflow as tf
        _Interpreter = tf.lite.Interpreter

_interp = _Interpreter(model_path=classifier_path, num_threads=1)
_interp.allocate_tensors()
_input_details = _interp.get_input_details()
_output_details = _interp.get_output_details()

def classify_with_confidence(landmark_list):
    """Retorna (index, confidence) usando el intérprete TFLite directamente."""
    _interp.set_tensor(_input_details[0]["index"], np.array([landmark_list], dtype=np.float32))
    _interp.invoke()
    result = _interp.get_tensor(_output_details[0]["index"])
    probs = np.squeeze(result)
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])
    return idx, confidence

# ─── Funciones de procesamiento ──────────────────────────────────────────────
def calc_landmark_list(image, landmarks):
    h, w = image.shape[:2]
    return [[min(int(lm.x * w), w - 1), min(int(lm.y * h), h - 1)]
            for lm in landmarks.landmark]

def pre_process_landmark(landmark_list):
    tmp = copy.deepcopy(landmark_list)
    base_x, base_y = tmp[0]
    for i in range(len(tmp)):
        tmp[i][0] -= base_x
        tmp[i][1] -= base_y
    flat = list(itertools.chain.from_iterable(tmp))
    max_val = max(map(abs, flat))
    return [v / max_val for v in flat] if max_val != 0 else flat

# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "labels": LABELS})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json(force=True)
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    try:
        # Decodificar base64 → imagen OpenCV
        b64 = data["image"]
        if "," in b64:
            b64 = b64.split(",")[1]
        img_bytes = base64.b64decode(b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv.imdecode(nparr, cv.IMREAD_COLOR)
        if img is None:
            return jsonify({"error": "Could not decode image"}), 400

        img_rgb = cv.cvtColor(img, cv.COLOR_BGR2RGB)
        mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        raw = detector.detect(mp_img)
        results = _wrap_results(raw)

        if results.multi_hand_landmarks is None:
            return jsonify({"letter": None, "confidence": 0.0, "detected": False})

        # Tomar la primera mano
        hand_landmarks = results.multi_hand_landmarks[0]
        landmark_list = calc_landmark_list(img, hand_landmarks)
        pre_processed = pre_process_landmark(landmark_list)
        letter_idx, confidence = classify_with_confidence(pre_processed)
        letter = LABELS[letter_idx]

        return jsonify({
            "letter": letter,
            "confidence": round(confidence, 4),
            "detected": True
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("[OK] Servidor ASL de prediccion iniciando en http://localhost:5050")
    print(f"[OK] Letras disponibles: {', '.join(LABELS)}")
    app.run(host="0.0.0.0", port=5050, debug=False)
