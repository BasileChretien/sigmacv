# Releases & supply-chain verification

SigmaCV releases are cryptographically signed with **keyless [Sigstore](https://www.sigstore.dev/)
signing** — there are no long-lived signing keys to manage or leak. Signatures are
minted by the release workflow using GitHub's OIDC identity and recorded in the
public [Rekor](https://docs.sigstore.dev/logging/overview/) transparency log.

This covers the integrity of the published artifacts; the application itself is
deployed from source (see [`SECURITY.md`](../SECURITY.md)).

## What is signed

On every **published GitHub release**, [`.github/workflows/release.yml`](../.github/workflows/release.yml):

1. generates a **CycloneDX SBOM** (`sbom.cdx.json`) and attaches it to the release;
2. produces a **SLSA build-provenance attestation** for the SBOM (GitHub-native); and
3. produces a **detached Sigstore signature bundle** (`sbom.cdx.json.cosign.bundle`,
   via `cosign`) and attaches it to the release.

Each release **tag** is additionally signed by the maintainer (see below), so GitHub
shows the tag as **Verified**.

## Verifying a release

You need either the [GitHub CLI](https://cli.github.com/) (`gh`) or
[`cosign`](https://docs.sigstore.dev/system_config/installation/). Download
`sbom.cdx.json` (and, for the second method, `sbom.cdx.json.cosign.bundle`) from the
release assets first.

**Method 1 — GitHub-native (build provenance):**

```bash
gh attestation verify sbom.cdx.json --repo BasileChretien/sigmacv
```

**Method 2 — portable (cosign / Sigstore):**

```bash
cosign verify-blob \
  --bundle sbom.cdx.json.cosign.bundle \
  --certificate-identity-regexp '^https://github\.com/BasileChretien/sigmacv/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  sbom.cdx.json
```

Both confirm the SBOM was produced by SigmaCV's own release workflow (not tampered
with or re-published by a third party). The `--certificate-identity-regexp` /
`--repo` checks pin the signer to this repository's workflow identity.

## Signing release tags (maintainer)

Release tags are signed locally before pushing. One-time setup (SSH signing is the
simplest; a GPG key works too):

```bash
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519.pub   # your key
git config --global tag.gpgsign true                         # sign every tag
```

Then add that **public key** to GitHub as a _Signing Key_
(Settings → SSH and GPG keys → New SSH key → key type **Signing Key**) so GitHub can
mark the tag **Verified**. Cut a release tag with:

```bash
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

Publishing the GitHub release for that tag triggers the signing workflow above.
