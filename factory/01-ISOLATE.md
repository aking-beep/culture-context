# Step 1 — Isolate

Every feature starts from a freshly fetched `origin/main` in `worktrees/<slug>/` using `bash scripts/factory-new.sh <slug>`. Do not edit the main checkout while the station is active. One agent owns one station for the feature's lifetime. Use a separate port for each running station. Tear down with the ship script or `git worktree remove`, never by deleting the directory blindly.
