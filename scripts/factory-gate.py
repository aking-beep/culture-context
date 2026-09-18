#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path

def main()->int:
    if len(sys.argv)!=2: print("usage: factory-gate.py <slug>",file=sys.stderr); return 2
    slug=sys.argv[1]; root=Path(subprocess.run(["git","rev-parse","--show-toplevel"],capture_output=True,text=True,check=True).stdout.strip())
    failures=[]; spec=root/"specs"/f"{slug}.md"; ev=root/"evidence"/slug
    if not spec.exists(): failures.append("spec missing")
    else:
        text=spec.read_text();
        if "Status:** APPROVED" not in text and "Status: APPROVED" not in text: failures.append("spec not APPROVED")
        if "TODO" in text: failures.append("spec contains TODO")
    if not ev.exists(): failures.append("evidence missing")
    else:
        captures=(ev/"captures.tsv").read_text() if (ev/"captures.tsv").exists() else ""
        if not re.search(r"^before\t",captures,re.M): failures.append("before capture missing")
        if not re.search(r"^after\t",captures,re.M): failures.append("after capture missing")
        if not any(p.name.startswith("before.") for p in ev.iterdir()): failures.append("before artefact missing")
        if not any(p.name.startswith("after.") for p in ev.iterdir()): failures.append("after artefact missing")
        evidence=(ev/"EVIDENCE.md").read_text() if (ev/"EVIDENCE.md").exists() else ""
        if not evidence: failures.append("EVIDENCE.md missing")
        elif "TODO" in evidence: failures.append("EVIDENCE.md contains TODO")
        review=(ev/"REVIEW.md").read_text() if (ev/"REVIEW.md").exists() else ""
        scores=re.findall(r"(\d)\s*/\s*5",review)
        if not scores or scores[-1]!="5": failures.append("latest review is not 5/5")
    cfg=root/"factory.config.json"
    if not cfg.exists(): failures.append("factory.config.json missing")
    else:
        for name,cmd in json.loads(cfg.read_text()).get("checks",{}).items():
            p=subprocess.run(cmd,shell=True,cwd=(root/"worktrees"/slug if (root/"worktrees"/slug).is_dir() else root))
            if p.returncode: failures.append(f"check failed: {name}")
    if failures:
        print("factory gate FAILED"); [print(" -",x) for x in failures]; return 1
    print("factory gate PASS"); return 0
if __name__=="__main__": raise SystemExit(main())
