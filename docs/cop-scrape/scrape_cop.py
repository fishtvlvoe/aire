#!/usr/bin/env python3
"""
cop.moi.gov.tw 資料抓取腳本

執行方式：
  cd docs/cop-scrape
  python3 scrape_cop.py

常用參數：
  python3 scrape_cop.py --service-id 24ED4437-DD2B-4FC1-A246-1AEF73681E0B
  python3 scrape_cop.py --category API --incremental --convert-md
  python3 scrape_cop.py --schedule daily --schedule-time 03:30
  python3 scrape_cop.py --schedule weekly --install-cron
"""

import argparse
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
import time
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

BASE_URL = "https://cop.moi.gov.tw"
API_BASE = "https://cop.moi.gov.tw/moiApi"
SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = SCRIPT_DIR
STATE_FILENAME = ".scrape_state.json"
CRON_MARKER_BEGIN = "# cop-scrape:auto:start"
CRON_MARKER_END = "# cop-scrape:auto:end"

CTX: "ScrapeContext | None" = None


class ScrapeContext:
    """Runtime options and counters shared by scrape functions."""

    def __init__(self, args: argparse.Namespace):
        self.args = args
        self.output_dir = Path(args.output).resolve()
        self.incremental = args.incremental
        self.force = args.force
        self.retries = max(1, args.retries)
        self.retry_delay = max(0.0, args.retry_delay)
        self.timeout = max(1, args.timeout)
        self.verbose = args.verbose
        self.state_path = self.output_dir / STATE_FILENAME
        self.state = self.load_state()
        self.stats = {
            "saved": 0,
            "unchanged": 0,
            "skipped": 0,
            "failed": 0,
            "retried": 0,
            "markdown": 0,
        }

    def load_state(self) -> dict[str, Any]:
        if not self.state_path.exists():
            return {"version": 1, "entries": {}}
        try:
            with self.state_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and isinstance(data.get("entries"), dict):
                return data
        except Exception as exc:
            print(f"  ⚠️ 讀取增量狀態失敗，將重新建立: {exc}")
        return {"version": 1, "entries": {}}

    def save_state(self) -> None:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.state["updatedAt"] = utc_now()
        self.state["options"] = {
            "incremental": self.incremental,
            "output": str(self.output_dir),
        }
        with self.state_path.open("w", encoding="utf-8") as f:
            json.dump(self.state, f, ensure_ascii=False, indent=2)
            f.write("\n")

    def record(self, key: str, filepath: Path, digest: str, source: str) -> None:
        self.state.setdefault("entries", {})[key] = {
            "sha256": digest,
            "filepath": str(filepath.relative_to(self.output_dir)),
            "source": source,
            "updatedAt": utc_now(),
        }

    def log_debug(self, message: str) -> None:
        if self.verbose:
            print(f"    {message}")


class SimpleMarkdownConverter(HTMLParser):
    """Small stdlib fallback for service HTML to Markdown conversion."""

    BLOCK_TAGS = {
        "article",
        "body",
        "div",
        "footer",
        "form",
        "header",
        "main",
        "nav",
        "p",
        "section",
        "table",
        "tbody",
        "thead",
        "tr",
    }

    SKIP_TAGS = {"script", "style", "noscript"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0
        self.link_stack: list[str | None] = []
        self.pre_depth = 0
        self.list_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_dict = {name.lower(): value for name, value in attrs}

        if tag in self.SKIP_TAGS:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return

        if tag in self.BLOCK_TAGS:
            self._newline(2 if tag in {"p", "section", "article", "body", "main"} else 1)
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            level = int(tag[1])
            self._newline(2)
            self.parts.append("#" * level + " ")
        elif tag == "br":
            self._newline(1)
        elif tag == "li":
            self._newline(1)
            self.parts.append("  " * max(0, self.list_depth - 1) + "- ")
        elif tag in {"ul", "ol"}:
            self.list_depth += 1
            self._newline(1)
        elif tag == "a":
            self.link_stack.append(attrs_dict.get("href"))
            self.parts.append("[")
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "code" and not self.pre_depth:
            self.parts.append("`")
        elif tag == "pre":
            self.pre_depth += 1
            self._newline(2)
            self.parts.append("```text\n")
        elif tag in {"td", "th"}:
            self.parts.append(" | ")

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in self.SKIP_TAGS:
            self.skip_depth = max(0, self.skip_depth - 1)
            return
        if self.skip_depth:
            return

        if tag == "a":
            href = self.link_stack.pop() if self.link_stack else None
            self.parts.append("]")
            if href:
                self.parts.append(f"({href})")
        elif tag in {"strong", "b"}:
            self.parts.append("**")
        elif tag in {"em", "i"}:
            self.parts.append("*")
        elif tag == "code" and not self.pre_depth:
            self.parts.append("`")
        elif tag == "pre":
            self.parts.append("\n```")
            self.pre_depth = max(0, self.pre_depth - 1)
            self._newline(2)
        elif tag in {"ul", "ol"}:
            self.list_depth = max(0, self.list_depth - 1)
            self._newline(1)
        elif tag in self.BLOCK_TAGS or tag in {"h1", "h2", "h3", "h4", "h5", "h6", "li"}:
            self._newline(1)

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        if self.pre_depth:
            self.parts.append(data)
            return
        text = re.sub(r"\s+", " ", unescape(data))
        if text.strip():
            self.parts.append(text)

    def markdown(self) -> str:
        text = "".join(self.parts)
        text = re.sub(r"[ \t]+\n", "\n", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r" +", " ", text)
        text = re.sub(r"\n +", "\n", text)
        return text.strip() + "\n"

    def _newline(self, count: int) -> None:
        current = "".join(self.parts[-3:])
        existing = len(current) - len(current.rstrip("\n"))
        needed = max(0, count - existing)
        if needed:
            self.parts.append("\n" * needed)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def current_context() -> ScrapeContext:
    if CTX is None:
        raise RuntimeError("Scrape context is not initialized")
    return CTX


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def normalize_json_bytes(data: Any, indent: int = 2) -> bytes:
    text = json.dumps(data, ensure_ascii=False, indent=indent) + "\n"
    return text.encode("utf-8")


def safe_filename(value: str) -> str:
    safe = re.sub(r"[^\w\u4e00-\u9fff.-]", "_", value)
    return safe or "unnamed"


def split_csv(values: list[str] | None) -> list[str]:
    if not values:
        return []
    result: list[str] = []
    for value in values:
        result.extend(item.strip() for item in value.split(",") if item.strip())
    return result


def run_curl(command: list[str], label: str) -> subprocess.CompletedProcess[str] | None:
    ctx = current_context()
    last_error = ""

    for attempt in range(1, ctx.retries + 1):
        try:
            ctx.log_debug("curl " + " ".join(shlex.quote(part) for part in command[1:]))
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=ctx.timeout,
            )
            if result.returncode == 0:
                return result
            last_error = result.stderr.strip() or result.stdout.strip() or f"exit {result.returncode}"
        except subprocess.TimeoutExpired:
            last_error = f"timeout after {ctx.timeout}s"
        except Exception as exc:
            last_error = str(exc)

        if attempt < ctx.retries:
            ctx.stats["retried"] += 1
            wait_seconds = ctx.retry_delay * attempt
            print(f"    ⚠️ {label} 失敗，重試 {attempt}/{ctx.retries - 1}: {last_error}")
            if wait_seconds:
                time.sleep(wait_seconds)

    ctx.stats["failed"] += 1
    print(f"  ⚠️ {label} 失敗: {last_error}")
    return None


def api_get(path: str) -> Any:
    """發送 GET 請求到 API（使用 curl，含重試）"""
    url = f"{API_BASE}{path}"
    result = run_curl(
        ["curl", "-skS", "--fail", "-H", "Accept: application/json", url],
        f"GET {path}",
    )
    if not result:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        current_context().stats["failed"] += 1
        print(f"  ⚠️ GET {path} JSON 解析失敗: {exc}")
        return None


def api_post(path: str, data: dict[str, Any] | None = None) -> Any:
    """發送 POST 請求到 API（使用 curl，含重試）"""
    url = f"{API_BASE}{path}"
    payload = json.dumps(data or {}, ensure_ascii=False)
    result = run_curl(
        [
            "curl",
            "-skS",
            "--fail",
            "-X",
            "POST",
            "-H",
            "Content-Type: application/json",
            "-H",
            "Accept: application/json",
            "-d",
            payload,
            url,
        ],
        f"POST {path}",
    )
    if not result:
        return None
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        current_context().stats["failed"] += 1
        print(f"  ⚠️ POST {path} JSON 解析失敗: {exc}")
        return None


def write_bytes(filepath: Path, content: bytes, source: str, key: str | None = None) -> bool:
    """Write content, skipping unchanged files in incremental mode."""
    ctx = current_context()
    filepath.parent.mkdir(parents=True, exist_ok=True)
    digest = sha256_bytes(content)
    state_key = key or str(filepath.relative_to(ctx.output_dir))

    if filepath.exists() and ctx.incremental and not ctx.force:
        existing = filepath.read_bytes()
        if sha256_bytes(existing) == digest:
            ctx.record(state_key, filepath, digest, source)
            ctx.stats["unchanged"] += 1
            print(f"  ⏭️ 未變更: {filepath}")
            return False

    filepath.write_bytes(content)
    ctx.record(state_key, filepath, digest, source)
    ctx.stats["saved"] += 1
    print(f"  ✅ 已儲存: {filepath}")
    return True


def save_json(filepath: str | Path, data: Any, indent: int = 2, source: str = "local") -> bool:
    """儲存 JSON 檔案"""
    return write_bytes(Path(filepath), normalize_json_bytes(data, indent), source)


def scrape_portal() -> Any:
    """抓取入口頁面資訊"""
    print("\n📌 1. 抓取入口資訊 (/api/Portal)")
    data = api_get("/api/Portal")
    if data:
        save_json(current_context().output_dir / "01-入口資訊" / "portal.json", data, source="/api/Portal")
    return data


def scrape_news() -> Any:
    """抓取最新消息"""
    print("\n📌 2. 抓取最新消息 (/api/SiteInfo/news)")
    data = api_get("/api/SiteInfo/news")
    if data:
        save_json(current_context().output_dir / "01-入口資訊" / "news.json", data, source="/api/SiteInfo/news")
    return data


def scrape_qa() -> Any:
    """抓取常見問題"""
    print("\n📌 3. 抓取常見問題 (/api/SiteInfo/qa)")
    data = api_get("/api/SiteInfo/qa")
    if data:
        save_json(current_context().output_dir / "01-入口資訊" / "qa.json", data, source="/api/SiteInfo/qa")
    return data


def scrape_pricing() -> list[dict[str, Any]]:
    """抓取全部服務價格資訊"""
    print("\n📌 4. 抓取服務價格 (/api/ServicesInfo/pricing)")
    data = api_get("/api/ServicesInfo/pricing")
    if data:
        save_json(
            current_context().output_dir / "02-服務列表" / "pricing.json",
            data,
            source="/api/ServicesInfo/pricing",
        )
    return data or []


def scrape_service_list() -> dict[str, Any]:
    """抓取服務列表（平台目前僅回傳指定頁面的描述資料）"""
    print("\n📌 5. 抓取服務列表 (/api/Services/service_list)")
    data = api_post("/api/Services/service_list", {"page": 1, "pageSize": 10})
    if data:
        save_json(
            current_context().output_dir / "02-服務列表" / "service_list.json",
            data,
            source="/api/Services/service_list",
        )
    return data or {}


def scrape_usage_stats() -> dict[str, Any]:
    """抓取服務使用統計"""
    print("\n📌 6. 抓取使用統計 (/api/ServicesInfo/serviceUsage)")
    all_data: list[dict[str, Any]] = []
    for page in range(1, 10):
        data = api_get(f"/api/ServicesInfo/serviceUsage?page={page}&pageSize=10")
        if not data or not data.get("data"):
            break
        all_data.extend(data["data"])
        print(f"    第 {page} 頁: {len(data['data'])} 筆")
        if len(data["data"]) < 10:
            break

    result = {"data": all_data, "totalCount": len(all_data)}
    save_json(
        current_context().output_dir / "02-服務列表" / "usage_stats.json",
        result,
        source="/api/ServicesInfo/serviceUsage",
    )
    return result


def merge_services(
    pricing: list[dict[str, Any]],
    service_list: dict[str, Any],
    usage_stats: dict[str, Any],
) -> list[dict[str, Any]]:
    """合併三個來源的服務資料"""
    print("\n📌 7. 合併服務資料")
    services: dict[str, dict[str, Any]] = {}

    for item in pricing:
        sid = item.get("serviceId")
        if sid:
            services[sid] = {
                "serviceId": sid,
                "serviceName": item.get("serviceName"),
                "priceDescribeUser": item.get("priceDescribeUser"),
                "priceDescribeGovernment": item.get("priceDescribeGovernment"),
                "documentUrl": item.get("documentUrl"),
                "serviceDescription": None,
                "tags": None,
                "ableToPurchase": None,
                "requestCount": 0,
            }

    if service_list and "data" in service_list:
        for item in service_list["data"]:
            sid = item.get("serviceId")
            if sid and sid in services:
                services[sid]["serviceDescription"] = item.get("serviceDescription")
                services[sid]["infoUrl"] = item.get("infoUrl")
                services[sid]["interfaceInfoUrl"] = item.get("interfaceInfoUrl")
                services[sid]["tags"] = item.get("tags")
                services[sid]["ableToPurchase"] = item.get("ableToPurchase")

    if usage_stats and "data" in usage_stats:
        for item in usage_stats["data"]:
            name = item.get("serviceName")
            count = item.get("requestCount", 0)
            for svc in services.values():
                if svc["serviceName"] == name:
                    svc["requestCount"] = count
                    break

    merged = list(services.values())
    save_json(
        current_context().output_dir / "02-服務列表" / "merged_services.json",
        merged,
        source="merged",
    )
    return merged


def service_category(service: dict[str, Any]) -> str:
    name = service.get("serviceName", "") or ""
    if name.startswith("MOI_API_"):
        return "API"
    if name.startswith("MOI_WFS_"):
        return "WFS"
    if name.startswith("MOI_WMS_"):
        return "WMS"
    return "OTHER"


def filter_services(services: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ctx = current_context()
    service_filters = [value.lower() for value in split_csv(ctx.args.service_id)]
    category = ctx.args.category

    filtered = []
    for svc in services:
        sid = (svc.get("serviceId") or "").lower()
        name = (svc.get("serviceName") or "").lower()
        if category and service_category(svc) != category:
            continue
        if service_filters and not any(item in {sid, name} or item in name for item in service_filters):
            continue
        filtered.append(svc)

    if service_filters or category:
        print("\n🔎 篩選服務")
        print(f"    service-id/name: {', '.join(service_filters) if service_filters else '未指定'}")
        print(f"    category: {category or '未指定'}")
        print(f"    符合筆數: {len(filtered)} / {len(services)}")
    return filtered


def has_service_filter() -> bool:
    ctx = current_context()
    return bool(ctx.args.service_id or ctx.args.category)


def categorize_services(services: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    """依服務類別分類儲存 (API / WFS / WMS)"""
    print("\n📌 8. 依類別分類儲存")
    ctx = current_context()
    root_name = "03-依類別分類_篩選" if has_service_filter() else "03-依類別分類"
    categories = {"API": [], "WFS": [], "WMS": [], "OTHER": []}

    for svc in services:
        categories[service_category(svc)].append(svc)

    for cat, items in categories.items():
        if not items:
            continue
        cat_dir = ctx.output_dir / root_name / cat
        save_json(cat_dir / f"{cat}_all.json", items, source=f"category:{cat}")

        for svc in items:
            safe_name = safe_filename(svc["serviceName"])
            save_json(cat_dir / f"{safe_name}.json", svc, source=f"category:{cat}")

        print(f"    {cat}: {len(items)} 個服務")

    return categories


def extract_document_links(services: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """提取所有 Google Drive 文件連結"""
    print("\n📌 9. 提取技術文件連結")
    links = []
    for svc in services:
        if svc.get("documentUrl"):
            links.append(
                {
                    "serviceId": svc["serviceId"],
                    "serviceName": svc["serviceName"],
                    "documentUrl": svc["documentUrl"],
                }
            )

    filename = "document_links_selected.json" if has_service_filter() else "document_links.json"
    save_json(current_context().output_dir / "04-技術文件連結" / filename, links, source="document-links")
    print(f"    共 {len(links)} 個文件連結")
    return links


def download_file(url: str, filepath: Path, label: str) -> str:
    """Download a file with retry and optional HTTP conditional request."""
    ctx = current_context()
    filepath.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = filepath.with_suffix(filepath.suffix + ".tmp")
    if tmp_path.exists():
        tmp_path.unlink()

    command = ["curl", "-skSL", "-o", str(tmp_path), "-w", "%{http_code}"]
    if ctx.incremental and filepath.exists() and not ctx.force:
        command.extend(["-z", str(filepath)])
    command.append(url)

    result = run_curl(command, label)
    if not result:
        if tmp_path.exists():
            tmp_path.unlink()
        return "failed"

    code = result.stdout.strip()[-3:]
    if code == "304":
        ctx.stats["unchanged"] += 1
        if tmp_path.exists():
            tmp_path.unlink()
        print(f"    ⏭️ 未變更: {filepath.name}")
        return "unchanged"

    if code != "200":
        ctx.stats["failed"] += 1
        if tmp_path.exists():
            tmp_path.unlink()
        print(f"    ⚠️ {label}: HTTP {code or 'unknown'}")
        return "failed"

    content = tmp_path.read_bytes()
    digest = sha256_bytes(content)
    if filepath.exists() and ctx.incremental and not ctx.force and sha256_bytes(filepath.read_bytes()) == digest:
        ctx.stats["unchanged"] += 1
        tmp_path.unlink()
        print(f"    ⏭️ 未變更: {filepath.name}")
        ctx.record(str(filepath.relative_to(ctx.output_dir)), filepath, digest, url)
        return "unchanged"

    tmp_path.replace(filepath)
    ctx.stats["saved"] += 1
    ctx.record(str(filepath.relative_to(ctx.output_dir)), filepath, digest, url)
    print(f"    ✅ 已儲存: {filepath.name}")
    return "saved"


def scrape_service_htmls(services: list[dict[str, Any]]) -> int:
    """抓取每個服務的靜態 HTML 說明文件"""
    print("\n📌 10. 抓取服務靜態 HTML 說明文件")
    html_dir = current_context().output_dir / "05-服務說明文件"
    html_dir.mkdir(parents=True, exist_ok=True)

    found = 0
    for svc in services:
        sid = svc["serviceId"]
        name = svc["serviceName"]
        url = f"{BASE_URL}/Service/service_Introduce/service_desc_{sid}.html"
        filepath = html_dir / f"{safe_filename(name)}.html"
        status = download_file(url, filepath, name)
        if status in {"saved", "unchanged"}:
            found += 1

    print(f"    共確認 {found} 個 HTML 說明文件")
    return found


def html_to_markdown(html_content: str) -> str:
    try:
        import html2text  # type: ignore

        converter = html2text.HTML2Text()
        converter.ignore_images = True
        converter.body_width = 0
        return converter.handle(html_content).strip() + "\n"
    except Exception:
        parser = SimpleMarkdownConverter()
        parser.feed(html_content)
        return parser.markdown()


def convert_service_htmls(services: list[dict[str, Any]]) -> int:
    """將 HTML 說明文件轉成 Markdown。"""
    print("\n📌 11. 轉換 HTML 說明文件為 Markdown")
    ctx = current_context()
    html_dir = ctx.output_dir / "05-服務說明文件"
    md_dir = ctx.output_dir / "06-服務說明文件Markdown"
    md_dir.mkdir(parents=True, exist_ok=True)

    converted = 0
    for svc in services:
        name = svc["serviceName"]
        html_path = html_dir / f"{safe_filename(name)}.html"
        md_path = md_dir / f"{safe_filename(name)}.md"

        if not html_path.exists():
            ctx.stats["skipped"] += 1
            print(f"    ⚠️ 找不到 HTML，略過: {name}")
            continue

        html_bytes = html_path.read_bytes()
        html_digest = sha256_bytes(html_bytes)
        html_content = html_bytes.decode("utf-8", errors="replace")
        body_md = html_to_markdown(html_content)
        source_url = f"{BASE_URL}/Service/service_Introduce/service_desc_{svc['serviceId']}.html"
        md_content = (
            f"# {name}\n\n"
            f"- serviceId: `{svc['serviceId']}`\n"
            f"- source: {source_url}\n"
            f"- sourceSha256: `{html_digest}`\n\n"
            f"{body_md}"
        )
        changed = write_bytes(
            md_path,
            md_content.encode("utf-8"),
            source=str(html_path.relative_to(ctx.output_dir)),
        )
        if changed or md_path.exists():
            converted += 1
            ctx.stats["markdown"] += 1

    print(f"    共轉換 {converted} 個 Markdown 檔")
    return converted


def ensure_output_dirs() -> None:
    ctx = current_context()
    subdirs = [
        "01-入口資訊",
        "02-服務列表",
        "03-依類別分類",
        "03-依類別分類_篩選",
        "04-技術文件連結",
        "05-服務說明文件",
        "06-服務說明文件Markdown",
    ]
    for subdir in subdirs:
        (ctx.output_dir / subdir).mkdir(parents=True, exist_ok=True)


def cron_line(args: argparse.Namespace) -> str:
    script = SCRIPT_DIR / "scrape_cop.py"
    python = shlex.quote(sys.executable or "python3")
    command_args = [
        "--incremental",
        "--convert-md",
        "--output",
        str(Path(args.output).resolve()),
        "--retries",
        str(args.retries),
    ]
    if args.force:
        command_args.append("--force")
    if args.category:
        command_args.extend(["--category", args.category])
    for service_id in split_csv(args.service_id):
        command_args.extend(["--service-id", service_id])

    minute, hour = parse_hhmm(args.schedule_time)
    if args.schedule == "daily":
        schedule = f"{minute} {hour} * * *"
    else:
        schedule = f"{minute} {hour} * * {args.schedule_weekday}"

    command = (
        f"cd {shlex.quote(str(SCRIPT_DIR))} && "
        f"{python} {shlex.quote(str(script))} {' '.join(shlex.quote(part) for part in command_args)} "
        f">> {shlex.quote(str(SCRIPT_DIR / 'scrape_cop.log'))} 2>&1"
    )
    return f"{schedule} {command}"


def parse_hhmm(value: str) -> tuple[int, int]:
    match = re.fullmatch(r"([01]?\d|2[0-3]):([0-5]\d)", value)
    if not match:
        raise argparse.ArgumentTypeError("--schedule-time 必須是 HH:MM，例如 03:30")
    hour = int(match.group(1))
    minute = int(match.group(2))
    return minute, hour


def handle_schedule(args: argparse.Namespace) -> None:
    parse_hhmm(args.schedule_time)
    line = cron_line(args)
    print("建議加入 crontab 的排程如下：")
    print()
    print(CRON_MARKER_BEGIN)
    print(line)
    print(CRON_MARKER_END)

    if not args.install_cron:
        install_args = ["python3", "scrape_cop.py", "--schedule", args.schedule, "--schedule-time", args.schedule_time]
        if args.schedule == "weekly":
            install_args.extend(["--schedule-weekday", str(args.schedule_weekday)])
        install_args.append("--install-cron")
        print()
        print("如要直接安裝，執行：")
        print("  " + " ".join(shlex.quote(part) for part in install_args))
        return

    current = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
    existing = current.stdout if current.returncode == 0 else ""
    pattern = re.compile(
        re.escape(CRON_MARKER_BEGIN) + r".*?" + re.escape(CRON_MARKER_END) + r"\n?",
        re.DOTALL,
    )
    cleaned = pattern.sub("", existing).rstrip()
    new_block = f"{CRON_MARKER_BEGIN}\n{line}\n{CRON_MARKER_END}\n"
    new_cron = (cleaned + "\n\n" + new_block).lstrip()
    install = subprocess.run(["crontab", "-"], input=new_cron, text=True, capture_output=True)
    if install.returncode != 0:
        raise SystemExit(f"安裝 crontab 失敗: {install.stderr.strip()}")
    print("\n✅ 已安裝 crontab 排程")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="抓取 cop.moi.gov.tw 公開 API、服務列表、HTML 說明文件，並可做增量更新與 Markdown 轉換。",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("--service-id", action="append", help="只處理指定 serviceId 或服務名稱，可重複或用逗號分隔")
    parser.add_argument("--category", choices=["API", "WFS", "WMS", "OTHER"], help="只處理指定服務類別")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT_DIR), help="輸出目錄")
    parser.add_argument("--incremental", action="store_true", help="增量模式：不覆寫未變更檔案，HTML 會使用 HTTP 條件請求")
    parser.add_argument("--force", action="store_true", help="強制重新寫入檔案，忽略增量判斷")
    parser.add_argument("--retries", type=int, default=3, help="curl 失敗重試次數")
    parser.add_argument("--retry-delay", type=float, default=1.5, help="重試等待秒數，會依第幾次重試線性增加")
    parser.add_argument("--timeout", type=int, default=30, help="每次 curl timeout 秒數")
    parser.add_argument("--convert-md", action="store_true", help="下載 HTML 後同步轉 Markdown")
    parser.add_argument("--json-only", action="store_true", help="只抓 API/JSON，不下載 HTML")
    parser.add_argument("--html-only", action="store_true", help="使用既有 merged_services.json，只抓 HTML/Markdown")
    parser.add_argument("--verbose", action="store_true", help="顯示詳細 curl 指令")
    parser.add_argument("--schedule", choices=["daily", "weekly"], help="產生每日/每週 crontab 排程")
    parser.add_argument("--schedule-time", default="03:30", help="排程執行時間 HH:MM")
    parser.add_argument("--schedule-weekday", type=int, choices=range(0, 7), default=1, help="weekly 的星期，0=Sunday, 1=Monday")
    parser.add_argument("--install-cron", action="store_true", help="搭配 --schedule，直接安裝/更新 crontab 區塊")
    return parser


def load_existing_services() -> list[dict[str, Any]]:
    ctx = current_context()
    path = ctx.output_dir / "02-服務列表" / "merged_services.json"
    if not path.exists():
        raise SystemExit(f"--html-only 需要先有 {path}")
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise SystemExit(f"{path} 格式不是服務列表")
    return data


def main() -> None:
    global CTX
    parser = build_parser()
    args = parser.parse_args()

    if args.schedule:
        handle_schedule(args)
        return
    if args.install_cron and not args.schedule:
        parser.error("--install-cron 必須搭配 --schedule")
    if args.json_only and args.html_only:
        parser.error("--json-only 與 --html-only 不能同時使用")

    CTX = ScrapeContext(args)
    ensure_output_dirs()

    print("=" * 60)
    print("  cop.moi.gov.tw 資料抓取腳本")
    print("=" * 60)
    print(f"  輸出目錄: {current_context().output_dir}")
    print(f"  增量模式: {'ON' if args.incremental else 'OFF'}")
    print(f"  重試次數: {args.retries}")

    portal = news = qa = None
    pricing: list[dict[str, Any]] = []
    service_list: dict[str, Any] = {}
    usage_stats: dict[str, Any] = {}

    if args.html_only:
        services = load_existing_services()
    else:
        portal = scrape_portal()
        news = scrape_news()
        qa = scrape_qa()
        pricing = scrape_pricing()
        service_list = scrape_service_list()
        usage_stats = scrape_usage_stats()
        services = merge_services(pricing, service_list, usage_stats)

    selected_services = filter_services(services)
    if (args.service_id or args.category) and not selected_services:
        raise SystemExit("找不到符合條件的服務，請檢查 --service-id 或 --category")

    if not args.html_only:
        categorize_services(selected_services)
        extract_document_links(selected_services)

    html_count = 0
    md_count = 0
    if not args.json_only:
        html_count = scrape_service_htmls(selected_services)
        if args.convert_md:
            md_count = convert_service_htmls(selected_services)

    current_context().save_state()

    print("\n" + "=" * 60)
    print("  ✅ 抓取完成！")
    print("=" * 60)
    print("\n  📊 統計：")
    if not args.html_only:
        print(f"     • 入口資訊: {'✅' if portal else '❌'}")
        print(f"     • 最新消息: {len(news.get('data', [])) if isinstance(news, dict) else 0} 筆")
        print(f"     • 常見問題: {len(qa) if qa else 0} 筆")
        print(f"     • 服務價格: {len(pricing)} 筆")
        print(f"     • 服務列表(含描述): {len(service_list.get('data', [])) if service_list else 0} 筆")
        print(f"     • 使用統計: {len(usage_stats.get('data', [])) if usage_stats else 0} 筆")
        print(f"     • 合併後總服務: {len(services)} 筆")
    print(f"     • 本次處理服務: {len(selected_services)} 筆")
    print(f"     • 靜態 HTML 說明文件: {html_count} 個")
    if args.convert_md:
        print(f"     • Markdown 說明文件: {md_count} 個")
    print(f"     • 寫入檔案: {current_context().stats['saved']} 個")
    print(f"     • 未變更: {current_context().stats['unchanged']} 個")
    print(f"     • 重試: {current_context().stats['retried']} 次")
    print(f"     • 失敗: {current_context().stats['failed']} 次")
    print(f"\n  📁 輸出目錄: {current_context().output_dir}")


if __name__ == "__main__":
    main()
