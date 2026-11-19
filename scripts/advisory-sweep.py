#!/usr/bin/env python3
"""Sweep dependensi produksi SafeKids terhadap OSV (Open Source Vulnerabilities).

Pola repo #24-#50: 1 POST ke api.osv.dev/v1/querybatch untuk semua paket
produksi. JANGAN ganti ke `npm audit` (melaporkan advisory dev-only
sebagai temuan produksi) atau ke GitHub Advisory DB API + GITHUB_TOKEN
(401 deterministik di CI).

Versi di bawah adalah versi ter-pin di package-lock.json (lockfileVersion 3)
per 19 Nov 2026. Kalau package.json/lockfile berubah, sesuaikan daftar ini.

Usage:
    python3 scripts/advisory-sweep.py
No token needed. Exit code 0 = production tree clean, 1 = findings,
2 = API error.
"""
import json
import sys
import urllib.request
import urllib.error

SEVERITIES = ("HIGH", "CRITICAL")
OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch"

# Dependensi produksi (dependencies di package.json) + versi lockfile.
PROD = [
    ("@react-three/drei", "9.122.0", "npm"),
    ("@react-three/fiber", "8.17.10", "npm"),
    ("@supabase/supabase-js", "2.106.0", "npm"),
    ("@types/file-saver", "2.0.7", "npm"),
    ("docx", "9.7.1", "npm"),
    ("file-saver", "2.0.5", "npm"),
    ("framer-motion", "11.18.2", "npm"),
    ("jspdf", "4.2.1", "npm"),
    ("jspdf-autotable", "5.0.8", "npm"),
    ("lucide-react", "0.441.0", "npm"),
    ("react", "18.3.1", "npm"),
    ("react-dom", "18.3.1", "npm"),
    ("react-router-dom", "6.30.3", "npm"),
    ("three", "0.169.0", "npm"),
    ("zustand", "4.5.7", "npm"),
]


def main() -> int:
    queries = [
        {"package": {"name": name, "ecosystem": eco}, "version": ver}
        for name, ver, eco in PROD
    ]
    body = json.dumps({"queries": queries}).encode()
    req = urllib.request.Request(
        OSV_BATCH_URL, data=body, headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.build_opener().open(req, timeout=60) as r:
            data = json.load(r)
    except urllib.error.HTTPError as e:
        print(f"OSV API error: HTTP {e.code}")
        return 2
    except Exception as e:
        print(f"OSV API error: {e}")
        return 2

    findings = []
    for (name, ver, _), result in zip(PROD, data.get("results", [])):
        for vuln in result.get("vulns", []):
            sev = "UNKNOWN"
            for s in vuln.get("severity", []):
                if s.get("type") == "CVSS_V3":
                    score = float(s["score"].split("/")[0]) if "/" in s["score"] else 0.0
                    sev = (
                        "CRITICAL" if score >= 9.0
                        else "HIGH" if score >= 7.0
                        else "MEDIUM" if score >= 4.0
                        else "LOW"
                    )
            if sev in SEVERITIES:
                findings.append((name, ver, vuln.get("id"), sev, vuln.get("summary", "")))

    if findings:
        print(f"ADVISORY-SWEEP: {len(findings)} temuan HIGH/CRITICAL produksi:")
        for name, ver, vid, sev, summary in findings:
            print(f"  {sev} {vid} {name}@{ver} — {summary}")
        return 1

    print(f"advisory-sweep: OK ({len(PROD)} paket produksi, 0 HIGH/CRITICAL)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
