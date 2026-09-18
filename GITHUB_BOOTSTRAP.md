# GitHub bootstrap

Target repository: `aking-beep/culture-context`.

The current ChatGPT GitHub connection can write commits/files/branches/PRs to an existing repository but cannot create a new repository object. Create one empty public or private repository named `culture-context` under `aking-beep` **without adding a README**, then either push this payload locally or return to ChatGPT and ask it to populate the now-existing repository.

Local push path:

```bash
unzip culture-context-repo.zip
cd culture-context
git init -b main
git add .
git commit -m "feat: initialize Culture Context standalone product"
git remote add origin https://github.com/aking-beep/culture-context.git
git push -u origin main
```
