# Handoff

**From:** SDE + DBA → **To:** QA + Security

- Built: see `decisions/sde/reports-export.md`. Commits 6dd1ff3, 6a8fee1, 763d643 on `feat/reports-export`.
- Test focus: refund-date attribution across days; History vs Reports agreement; export file contents; owner guard; phone layout.
- Security focus: formula injection in CSV/XLSX, data leaving the device in exports, lazy chunk loading, dependency audit.
