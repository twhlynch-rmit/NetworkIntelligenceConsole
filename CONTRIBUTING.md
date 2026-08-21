# Contributing

## Branching

- Never push directly to `main`.
- Create a feature branch from `main` before starting work.
- Name branches using [conventional branch
  naming](https://conventionalbranch.org/), lowercase, hyphen-separated, and
  descriptive.

## Commits

- Write clear, concise commit messages using [conventional
  commits](https://www.conventionalcommits.org/en/v1.0.0/).
- Each commit should be **atomic**; one logical change per commit. Don't bundle
  unrelated changes or hotfixes.
- Commit only relevant files. Don't commit IDE config, local logs, or temporary
  files.

## Pull Requests

- Open a PR against `main` when your feature is ready for review.
- PRs require **at least 1 approvals** before merging.
- Keep PRs focused. If a PR covers multiple unrelated changes, split it up.
- Write a short summary in the PR description explaining what changed and why.

## Code Formatting

- All code must be formatted with relevant tooling.

## Testing

- Write tests for every new feature or bug fix.
- All tests must pass before a PR can be merged.
- Aim for meaningful coverage, not just line count. Test edge cases and error
  paths.

## Definition of Done

A feature is not complete until:

- Code has been reviewed and approved by at least 1 other team member.
- Tests are written and passing. The person who tests the code should not be
  the person who wrote it.
- Relevant docs are updated if the change affects system design.
