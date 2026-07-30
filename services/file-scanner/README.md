# UnitPulse file-scanner contract

Uploads land only in the private `quarantine` bucket. A scanner worker must:

1. claim a `project_files` row whose `scan_status` is `quarantined`;
2. set it to `scanning`;
3. download the object with a service credential;
4. scan it with a current ClamAV database and verify that its detected type matches the allowed PDF, DOCX, image, or text formats;
5. calculate SHA-256; and
6. call `POST /api/files/scan-callback` with `Authorization: Bearer $SCANNER_CALLBACK_SECRET`.

Example body:

```json
{
  "fileId": "00000000-0000-0000-0000-000000000000",
  "status": "clean",
  "sha256": "64-lowercase-hex-characters",
  "detail": "ClamAV signature database version"
}
```

Only a `clean` result copies the object into `clean-project-files`; rejected files remain unavailable to users. Deploy the scanner separately from the web process so a malicious document never reaches the application runtime.
