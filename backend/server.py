import sys
import os

# Ensure 'backend/' is on Python's module search path so that
# 'from app.main import app' resolves 'app' as 'backend/app/'
# Vercel sets sys.path to the directory containing this file (backend/),
# but adding it explicitly is safe and makes imports deterministic.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

__all__ = ["app"]
