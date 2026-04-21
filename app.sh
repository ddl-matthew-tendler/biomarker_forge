#!/bin/bash
set -e

# Install dependencies
pip install -r /mnt/code/requirements.txt --quiet

# Set Python path so src package is importable
export PYTHONPATH=/mnt/code:$PYTHONPATH

# Domino Publishing requires the app to listen on port 8888
exec uvicorn src.api.main:app \
  --host 0.0.0.0 \
  --port 8888 \
  --workers 1
