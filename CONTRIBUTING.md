# Contributing

1. Run `npm install`, `npm run typecheck`, and `npm run build` from the repository root.
2. Create a virtual environment and install `pip install -e ".[devel]"`.
3. Run `pytest -q` from the repository root.
4. Serve `examples/vanilla.html` and verify direct `append()` updates.
5. Open `streamlit run example.py` and verify hover, legend toggles, Fit, and both zoom buttons.

Keep `ChartData` backward compatible. New rendering features must work in the core before adapters expose them.
