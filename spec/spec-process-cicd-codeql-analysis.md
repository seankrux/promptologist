---
title: CI/CD Workflow Specification - CodeQL
version: 1.0
date_created: 2026-08-23
last_updated: 2026-08-23
owner: seankrux
tags: [process, cicd, github-actions, security, codeql, promptologist]
---

## Workflow Overview

**Purpose**: Copied CodeQL analysis template for javascript/python.
**Trigger Events**: Daily 02:00 UTC; push to main/master; pull requests.

## Jobs & Dependencies

| Job Name | Purpose | Dependencies | Execution Context |
|---|---|---|---|
| analyze | CodeQL init/autobuild/analyze | none | ubuntu-latest |

## Notes

This is a copied fleet template. Language matrix should be narrowed if the repo is not polyglot.

## Change Management

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-08-23 | Initial specification | fleet audit |
