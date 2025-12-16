# Working with npm & GitHub Packages (Private Vœrynth Système Registry)

Vœrynth OS is distributed privately via **GitHub Packages** so investors, collaborators, and build partners can consume internal packages without public exposure. Use the steps below to authenticate, install private dependencies, and publish scoped builds back to the registry.

> **Confidentiality:** Tokens and registry URLs are for private distribution only. Do not share beyond authorized collaborators under NDA or written agreement.

---

## 1) Create a Personal Access Token (PAT)

1. Visit **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Scope the token to this repository (or the Vœrynth org) with permissions:
   - **Packages**: `read` and `write`
   - **Contents**: `read` (required for installs from private repos)
3. Copy the token; it will be used as `NODE_AUTH_TOKEN` or `_authToken`.

---

## 2) Configure `.npmrc` for the `@kiranvenom1209` scope

Create or update `~/.npmrc` (or project-level `.npmrc`) with the Vœrynth scope and GitHub Packages registry:

```ini
@kiranvenom1209:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
always-auth=true
```

- Set `NODE_AUTH_TOKEN` in your shell before installing or publishing:
  ```bash
  export NODE_AUTH_TOKEN=ghp_your_fine_grained_token_here
  ```
- This keeps tokens out of version control while enabling automated CI/CD or local installs.

---

## 3) Install packages from GitHub Packages

With the `.npmrc` above in place, scoped packages such as `@kiranvenom1209/voerynth-os` resolve from GitHub Packages:

```bash
npm install @kiranvenom1209/voerynth-os
```

For other private packages under the same scope, use the same pattern: `npm install @kiranvenom1209/<package-name>`.

---

## 4) Publish Vœrynth OS to GitHub Packages

1. Ensure the package name is scoped (`@kiranvenom1209/voerynth-os`) and **not** marked private in `package.json`.
2. Confirm `publishConfig.registry` points to `https://npm.pkg.github.com` (already set).
3. Authenticate via `NODE_AUTH_TOKEN` (see step 2).
4. Run the publish script:
   ```bash
   npm run publish:gh-packages
   ```
5. The package will appear under **Packages** in the GitHub repository, accessible only to users with granted permissions.

> **Tip:** For CI, add `NODE_AUTH_TOKEN` as an encrypted secret and run `npm ci` / `npm publish` within the same authenticated context.

---

## 5) Using the package in other private repos

1. Add the same `.npmrc` configuration to the consuming repository (user-level or project-level).
2. Declare the dependency with its scope:
   ```json
   {
     "dependencies": {
       "@kiranvenom1209/voerynth-os": "^5.0.1"
     }
   }
   ```
3. Run `npm install` — npm will fetch from GitHub Packages using the provided token.

---

## 6) Common troubleshooting

- **401 Unauthorized**: Token missing `read:packages`/`write:packages` or not exported as `NODE_AUTH_TOKEN`.
- **404 Not Found**: Package scope mismatch; ensure dependency uses `@kiranvenom1209/` prefix and `.npmrc` points to GitHub Packages.
- **E403 (forbidden to publish)**: Package marked `private` or missing `write:packages` scope on the token.

---

Vœrynth Système distributes artifacts privately. Keep registry credentials secure and rotate tokens regularly.
