# Step 4 — Ship

A reviewer who did not build the feature reads the evidence first, then the spec and diff, and scores `RUBRIC.md`. Anything below 5/5 returns to the builder. At 5/5 run:

```bash
python3 scripts/factory-gate.py <slug>
bash scripts/factory-ship.sh <slug>
```

No red gate merges.
