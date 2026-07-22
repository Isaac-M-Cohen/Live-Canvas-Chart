# Contributing

1. Create a virtual environment and install `pip install -e ".[devel]"`.
2. Run `npm ci && npm run build` in `streamlit_live_canvas/frontend`.
3. Run `pytest -q` from the repository root.
4. Open `streamlit run example.py` and verify hover, legend toggles, Fit, and both zoom buttons.

Keep the Python payload schema backward compatible. New rendering features should work for both fixed series and points appended from a WebSocket.
