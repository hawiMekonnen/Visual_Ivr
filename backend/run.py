import sys
import uvicorn

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

if __name__ == "__main__":
    print("[INFO] Starting Visual IVR Backend on 0.0.0.0:8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
