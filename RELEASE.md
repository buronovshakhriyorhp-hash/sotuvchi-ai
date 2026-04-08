# Release Process

This repository uses semantic versioning for release management.

## Creating a release

1. Update code and commit changes.
2. Run:
   ```bash
   npm install
   npm run release
   ```
3. This runs `npm version patch` and pushes the new tag to `origin/main`.
4. After pushing, the GitHub release workflow will create a release from the tag.

## Tag format

- Patch: `v1.0.1`
- Minor: `v1.1.0`
- Major: `v2.0.0`

## Release notes

- Use GitHub releases to publish release notes and changelog entries.
- If this repo uses `CHANGELOG.md`, update it before tagging.
