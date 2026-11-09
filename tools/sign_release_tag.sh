#!/usr/bin/env bash
# sign_release_tag.sh — membuat annotated signed tag untuk rilis (langkah C).
#
# Tag bertanda tangan (SSH atau GPG) menautkan versi + commit + tanggal +
# identitas signer secara kriptografis. Ini membuktikan siapa yang membuat
# tag, BUKAN persetujuan rilis (persetujuan = GitHub Environment `release`,
# lihat rekease-gate.yml). Code signing biner (A) tetap ditunda ke Stable.
#
# Cara pakai:
#   tools/sign_release_tag.sh v0.1.0
#   tools/sign_release_tag.sh v0.1.0 --message "Rilis v0.1.0 (Beta unsigned)"
#
# Syarat (satu kali, di mesin pemilik):
#   git config --global commit.gpgsign true
#   git config --global tag.gpgsign true
#   git config --global gpg.format ssh           # atau: gpg
#   git config --global user.signingkey ~/.ssh/id_ed25519.pub   # SSH
#   (untuk GPG: user.signingkey <key-id>; kunci SSH harus ditambahkan
#    ke akun GitHub sebagai signing key agar verifikasi berfungsi)
# Verifikasi lokal (sekali saja):
#   printf '%s %s\n' "<principal>" "$(cat ~/.ssh/id_ed25519.pub)" > ~/.ssh/allowed_signers
#   git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers
set -euo pipefail

VERSION="${1:?pakai: tools/sign_release_tag.sh vX.Y.Z [--message ...]}"
shift || true
MESSAGE="Rilis $VERSION (Beta unsigned, code signing ditunda ke Stable)"

while [ $# -gt 0 ]; do
  case "$1" in
    --message) MESSAGE="$2"; shift 2 ;;
    *) echo "Argumen tak dikenal: $1" >&2; exit 2 ;;
  esac
done

# Verifikasi dasar (fail-closed): repo bersih untuk file tracked, tag belum
# ada, HEAD sudah di origin. Untracked dirs (.workbuddy-ai/, notes/,
# prototypes/) memang tidak di-commit dan tidak boleh memblokir pengetagan.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Working tree tidak bersih — commit/stash dulu." >&2; exit 1
fi
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "Tag $VERSION sudah ada." >&2; exit 1
fi
HEAD_SHA="$(git rev-parse HEAD)"
if ! git ls-remote origin main | grep -q "$HEAD_SHA"; then
  echo "HEAD ($HEAD_SHA) belum ter-push ke origin/main." >&2; exit 1
fi
if ! git config --get tag.gpgsign >/dev/null 2>&1 || [ "$(git config --get tag.gpgsign)" != "true" ]; then
  echo "tag.gpgsign belum aktif — jalankan perintah syarat di header skrip ini." >&2; exit 1
fi

# Buat tag bertanda tangan (annotated) di HEAD yang ter-push.
git tag -s "$VERSION" -m "$MESSAGE" "$HEAD_SHA"
git push origin "refs/tags/$VERSION"

# Verifikasi tanda tangan (hanya berhasil bila kunci signer terdaftar di GitHub).
if git tag -v "$VERSION" 2>/dev/null; then
  echo "OK: tag $VERSION bertanda tangan dan terverifikasi."
else
  echo "Tag $VERSION dibuat, tetapi verifikasi lokal gagal — kunci signer mungkin belum terdaftar di GitHub." >&2
  exit 3
fi
