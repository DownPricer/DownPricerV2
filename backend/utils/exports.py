import json
import os
import shutil
import tempfile
from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from fastapi import BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from openpyxl import Workbook


def parse_date_range(start: Optional[str], end: Optional[str]) -> Tuple[datetime, datetime, str, str]:
    """
    Parse YYYY-MM-DD date inputs into UTC datetime bounds.
    Defaults to the last 30 days when missing.
    """
    today = datetime.now(timezone.utc).date()

    if start and not end:
        start_date = _parse_date(start, "start")
        end_date = today
    elif end and not start:
        end_date = _parse_date(end, "end")
        start_date = end_date - timedelta(days=30)
    elif start and end:
        start_date = _parse_date(start, "start")
        end_date = _parse_date(end, "end")
    else:
        end_date = today
        start_date = end_date - timedelta(days=30)

    if start_date > end_date:
        raise HTTPException(status_code=400, detail="La date de début doit précéder la date de fin.")

    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date, time.max, tzinfo=timezone.utc)

    return start_dt, end_dt, start_date.isoformat(), end_date.isoformat()


def build_filename(prefix: str, start_date: str, end_date: str, ext: str) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{prefix}_{start_date}_{end_date}_{timestamp}.{ext}"


def format_platform_links(links: Any) -> str:
    if not isinstance(links, dict):
        return ""
    parts = []
    for key in ["vinted", "leboncoin", "other"]:
        value = links.get(key)
        if value:
            parts.append(f"{key}:{value}")
    return " | ".join(parts)


def serialize_cell(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, (list, dict)):
        return json.dumps(value, ensure_ascii=True)
    return value


def create_xlsx_file(sheets: List[Dict[str, Any]], output_path: Optional[str] = None) -> str:
    wb = Workbook(write_only=True)
    for sheet in sheets:
        title = sheet["title"]
        columns = sheet["columns"]
        rows = sheet.get("rows", [])

        ws = wb.create_sheet(title=title)
        ws.append(columns)
        for row in rows:
            ws.append([serialize_cell(row.get(col, "")) for col in columns])

    if output_path:
        wb.save(output_path)
        return output_path

    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    wb.save(tmp_file.name)
    tmp_file.close()
    return tmp_file.name


def stream_file_response(
    path: str,
    filename: str,
    background_tasks: BackgroundTasks,
    media_type: str,
) -> StreamingResponse:
    def _iterator(file_path: str) -> Iterable[bytes]:
        with open(file_path, "rb") as handle:
            while True:
                chunk = handle.read(1024 * 1024)
                if not chunk:
                    break
                yield chunk

    background_tasks.add_task(_cleanup_path, path)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return StreamingResponse(_iterator(path), headers=headers, media_type=media_type)


def create_temp_dir() -> str:
    return tempfile.mkdtemp(prefix="exports_")


def cleanup_paths(paths: List[str]) -> None:
    for path in paths:
        _cleanup_path(path)


def _cleanup_path(path: str) -> None:
    if not path:
        return
    try:
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
        elif os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def _parse_date(value: str, label: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Format de date invalide pour {label}. Utilisez YYYY-MM-DD.",
        ) from exc

