# Security Policy

## Supported Versions

This project currently supports the latest `main` branch only.

## Reporting a Vulnerability

Please do not open a public issue for security-sensitive problems.

Share the report privately with the maintainer and include:

- affected version or commit
- reproduction steps
- impact summary
- any suggested mitigation

## Local Safety Notes

This project reads and writes local OpenClaw configuration and may open a local browser automation session for OpenClaw Control.

Before contributing changes in these areas, double-check:

- file write targets
- local config mutation behavior
- browser automation entry points
- temporary file cleanup

