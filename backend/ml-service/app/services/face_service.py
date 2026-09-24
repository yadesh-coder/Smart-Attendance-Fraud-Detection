import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
import base64
import os
import onnxruntime as ort

class FaceService:
    _app = None
    _ort_session = None
    _input_name = None
    _output_name = None

    @classmethod
    def get_app(cls):
        if cls._app is None:
            try:
                app = FaceAnalysis(name='buffalo_sc', providers=['CPUExecutionProvider'])
                app.prepare(ctx_id=0, det_size=(640, 640))
                cls._app = app
                print("FaceService: InsightFace FaceAnalysis (buffalo_sc) initialized successfully.")
            except Exception as e:
                print(f"FaceService: InsightFace FaceAnalysis init error: {e}")
                cls._app = False
        return cls._app if cls._app is not False else None

    @classmethod
    def get_ort_session(cls):
        if cls._ort_session is None:
            try:
                model_path = r"C:\Users\Yadesh\.insightface\models\buffalo_sc\w600k_mbf.onnx"
                if os.path.exists(model_path):
                    cls._ort_session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
                    cls._input_name = cls._ort_session.get_inputs()[0].name
                    cls._output_name = cls._ort_session.get_outputs()[0].name
                    print("FaceService: Direct ONNX ArcFace session initialized.")
            except Exception as e:
                print(f"FaceService: ONNX session init error: {e}")
        return cls._ort_session

    @classmethod
    def extract_arcface_embedding(cls, image_bytes: bytes):
        if not image_bytes or len(image_bytes) < 50:
            return None, 0, "FACE_INVALID", {}

        import hashlib, time
        frame_id = "FRM_" + hashlib.sha256(image_bytes).hexdigest()[:12]
        frame_ts = int(time.time() * 1000)
        byte_len = len(image_bytes)

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None or img.size == 0 or img.shape[0] < 10 or img.shape[1] < 10:
                return None, 0, "FACE_INVALID", {"frameId": frame_id, "frameTimestamp": frame_ts, "imageByteLength": byte_len}
            dims = f"{img.shape[1]}x{img.shape[0]}"
        except Exception:
            return None, 0, "FACE_INVALID", {"frameId": frame_id, "frameTimestamp": frame_ts, "imageByteLength": byte_len}

        meta = {
            "frameId": frame_id,
            "frameTimestamp": frame_ts,
            "imageDimensions": dims,
            "imageByteLength": byte_len
        }

        app = cls.get_app()
        if app is not None:
            try:
                faces = app.get(img)
                if len(faces) == 0:
                    return None, 0, "FACE_NOT_DETECTED", meta
                elif len(faces) > 1:
                    return None, len(faces), "MULTIPLE_FACES_DETECTED", meta
                else:
                    emb = faces[0].embedding
                    norm = np.linalg.norm(emb)
                    if norm > 0:
                        emb = emb / norm
                    meta["liveEmbeddingNorm"] = float(norm)
                    return emb.tolist(), 1, "OK", meta
            except Exception as e:
                print(f"InsightFace processing error: {e}")
                return None, 0, "FACE_INVALID", meta

        return None, 0, "FACE_NOT_DETECTED", meta

    @classmethod
    def _extract_via_direct_onnx(cls, img, face_cnt, fallback_status):
        session = cls.get_ort_session()
        if session is None:
            return None, 0, fallback_status

        try:
            h, w = img.shape[:2]
            # Center crop region
            crop = img[int(h*0.05):int(h*0.95), int(w*0.05):int(w*0.95)]
            resized = cv2.resize(crop, (112, 112))
            rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
            blob = (rgb.astype(np.float32) - 127.5) / 127.5
            blob = np.transpose(blob, (2, 0, 1))
            blob = np.expand_dims(blob, axis=0)

            out = session.run([cls._output_name], {cls._input_name: blob})[0]
            emb = out[0]
            norm = np.linalg.norm(emb)
            if norm > 0:
                emb = emb / norm
            return emb.tolist(), 1, "OK"
        except Exception as e:
            print(f"Direct ONNX ArcFace error: {e}")
            return None, 0, fallback_status

    @classmethod
    def compute_cosine_similarity(cls, v1, v2):
        if not v1 or not v2 or len(v1) != len(v2):
            return 0.0
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
