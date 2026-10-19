#!/usr/bin/env bash
# Make a complete, verifiable, off-GitHub copy of the old Crypto terminal repository.
#
# Adapted from the shared platform's backup script, with the repo list narrowed to Crypto alone and two additions:
# a fingerprint of every file on every branch (so the data can be checked file by file later, not only as one
# bundle), and a check that no file is a Git LFS pointer (a bundle holds only the pointer, not the data).
#
# What you get in OUT_DIR (default: ./repo-backup-YYYY-MM-DD):
#   Crypto.bundle        every branch, tag and commit in ONE file, including the whole `data` branch history
#   Crypto.refs          every branch and the commit it pointed at when the backup was taken
#   Crypto.files.sha256  SHA-256 of every file at the tip of every branch: "<sha256>  <branch>:<path>"
#   SHA256SUMS           fingerprints of the files above, so a later copy can be checked with `sha256sum -c SHA256SUMS`
#   README.txt           how to check and restore
#
# A git bundle is a plain file: copy it to a USB drive, Google Drive, Backblaze, anywhere. To get a working
# repository back from it:  git clone Crypto.bundle Crypto
#
# Read-only towards GitHub: it only clones. Works for a private repo too, as long as your own git login can read it.
#
#   bash scripts/backup_repos.sh                 # writes ./repo-backup-<today>
#   bash scripts/backup_repos.sh /path/to/dir    # writes there
set -euo pipefail

OWNER="MinimumLizard"
REPOS=(Crypto)
OUT_DIR="${1:-./repo-backup-$(date -u +%Y-%m-%d)}"

mkdir -p "$OUT_DIR"
OUT_DIR="$(cd "$OUT_DIR" && pwd)"   # absolute, so later cd/git -C calls agree on it
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

for repo in "${REPOS[@]}"; do
  echo "== $repo"
  # --mirror copies every branch and tag, not just the default branch (the crypto history lives on `data`).
  # OLD_REPOS_TOKEN (optional): a read-only token, needed once the repo is private.
  AUTH=""; [ -n "${OLD_REPOS_TOKEN:-}" ] && AUTH="x-access-token:${OLD_REPOS_TOKEN}@"
  GIT_LFS_SKIP_SMUDGE=1 git clone --quiet --mirror "https://${AUTH}github.com/$OWNER/$repo.git" "$WORK/$repo.git"
  git -C "$WORK/$repo.git" bundle create "$OUT_DIR/$repo.bundle" --all 2>/dev/null
  # Prove the bundle is complete and readable before trusting it.
  git bundle verify "$OUT_DIR/$repo.bundle" >/dev/null
  git -C "$WORK/$repo.git" for-each-ref --format='%(objectname) %(refname)' > "$OUT_DIR/$repo.refs"

  # Restore the bundle into a fresh clone and check every branch points at the same commit as on GitHub.
  git clone --quiet --mirror "$OUT_DIR/$repo.bundle" "$WORK/$repo-restored.git"
  if ! diff <(git -C "$WORK/$repo-restored.git" for-each-ref --format='%(objectname) %(refname)' refs/heads refs/tags) \
            <(grep -E ' refs/(heads|tags)/' "$OUT_DIR/$repo.refs"); then
    echo "ERROR: the restored bundle's branches differ from GitHub's" >&2; exit 1
  fi
  git -C "$WORK/$repo-restored.git" fsck --full --no-dangling >/dev/null

  # Fingerprint every file at the tip of every branch, read from the restored bundle (so it also proves the bundle
  # holds the bytes), and refuse to continue if any file is a Git LFS pointer.
  : > "$OUT_DIR/$repo.files.sha256"
  lfs=0
  for branch in $(git -C "$WORK/$repo-restored.git" for-each-ref --format='%(refname:short)' refs/heads); do
    while IFS=$'\t' read -r meta path; do
      blob="${meta##* }"
      if git -C "$WORK/$repo-restored.git" cat-file blob "$blob" | head -c 200 | grep -q '^version https://git-lfs'; then
        echo "WARNING: $branch:$path is a Git LFS pointer; the bundle does not hold its data" >&2; lfs=$((lfs + 1))
      fi
      sum="$(git -C "$WORK/$repo-restored.git" cat-file blob "$blob" | sha256sum | cut -d' ' -f1)"
      printf '%s  %s:%s\n' "$sum" "$branch" "$path" >> "$OUT_DIR/$repo.files.sha256"
    done < <(git -C "$WORK/$repo-restored.git" -c core.quotePath=false ls-tree -r "$branch" | grep -P '^\d+ blob ' | sed -E 's/^[0-9]+ blob ([0-9a-f]+)\t/blob \1\t/')
  done
  [ "$lfs" -eq 0 ] || { echo "ERROR: $lfs LFS pointer(s); fetch the LFS objects separately before relying on this backup" >&2; exit 1; }

  echo "   $(git -C "$WORK/$repo.git" rev-list --all --count) commits, branches: $(git -C "$WORK/$repo.git" branch --format='%(refname:short)' | tr '\n' ' ')"
  echo "   $(wc -l < "$OUT_DIR/$repo.files.sha256") files fingerprinted; no LFS pointers; restore test passed"
done

cat > "$OUT_DIR/README.txt" <<EOF
Backup of github.com/$OWNER/{${REPOS[*]}} taken $(date -u +%Y-%m-%dT%H:%M:%SZ).

Check nothing was damaged in transit:          sha256sum -c SHA256SUMS
Restore the repository (every branch):         git clone --mirror Crypto.bundle Crypto.git
Restore one branch as a working copy:          git clone -b data Crypto.bundle Crypto-data
Check the restored data file by file:          see Crypto.files.sha256 ("<sha256>  <branch>:<path>");
  for a branch checked out in Crypto-data:     cd Crypto-data && grep '  data:' ../Crypto.files.sha256 | sed 's/  data:/  /' | sha256sum -c --quiet
Branches and the commits they pointed at:      Crypto.refs
EOF

( cd "$OUT_DIR" && sha256sum ./*.bundle ./*.refs ./*.files.sha256 README.txt > SHA256SUMS )
echo "Done: $OUT_DIR"
cat "$OUT_DIR/SHA256SUMS"
