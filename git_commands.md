# 🌿 Git Workflow Guide – PlantKeeper Project

A simple guide to help you work smoothly with Git while developing the PlantKeeper app. This includes branch management, syncing with `master`, and solving common GitHub warnings.

---

## 🔧 1. Setup (First Time Only)

Set your global Git user identity:

```
git config --global user.name "github_username"
git config --global user.email "github_email"
```

---

## 📦 2. Cloning the Project

Only needed when starting from scratch:

```
git clone https://github.com/LielBiton-dev/plantKeeper-app.git
cd plantKeeper-app
```

---

## 🌿 3. Working on Your Branch

Create or switch to your branch:

```
git checkout -b your_branch_name     # create and switch to a new branch
# OR
git checkout liel_branch             # switch to an existing branch
```

Check your branch & file status:

```
git status
git branch
```

---

## ➕ 4. Add, Commit & Push Changes

To save and upload your work to GitHub:

```
git add .
git commit -m "Describe what changed"
git push
```

---

## 🔄 5. Sync Your Branch with \`master\`

Pull the latest updates from `master` into your branch:

```
git pull origin master
```

This brings any new changes from `master` into your current branch.

---

## 🧠 6. Common Problems & Fixes

### 🧬 "This branch is 3 commits behind master"

**Why:** `master` has new commits that your branch doesn’t.

**Fix:**

```
git merge origin/master
git push
```

---

### 🚀 "This branch is 3 commits ahead of master"

**Why:** Your branch has changes that `master` doesn't.

**Fix:**

```
git checkout master
git pull origin master              # Make sure master is current
git merge your_branch_name          # Merge your branch into master
git push origin master
```

---

## 📌 7. Summary Cheat Sheet

```
git checkout branch         # Switch to a branch
git status                  # Show modified files
git branch                  # List all local branches
git pull origin master      # Bring latest master changes into your branch
git merge origin/master     # Merge master into your branch
git add .                   # Stage all changes
git commit -m "msg"         # Commit staged changes
git push                    # Push local commits to GitHub
git push origin master      # Push to master branch (if you're allowed)
```

---

Happy branching! 🌱  
Let me know if you need help with merge conflicts, rebasing, or GitHub workflows.
