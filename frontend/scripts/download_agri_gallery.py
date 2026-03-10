#!/usr/bin/env python3
"""
Download 150 HD agriculture/agrotechnology images for the dashboard gallery.

Output:
  frontend/public/assets/agri-gallery/agri-001.jpg ... agri-150.jpg
  frontend/public/assets/agri-gallery/metadata.json
"""

from __future__ import annotations

import hashlib
import json
import random
import time
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.error import HTTPError, URLError


TARGET_COUNT = 150
MAX_ATTEMPTS = 1800
BASE_WIDTH = 1920
BASE_HEIGHT = 1080
USER_AGENT = "KrishiMitraAI/1.0 (image dataset builder)"

TAG_SETS = [
    "agriculture,farm",
    "agriculture,technology",
    "agritech,farm",
    "precisionfarming,agriculture",
    "tractor,farm",
    "harvest,crops",
    "irrigation,farm",
    "greenhouse,agriculture",
    "drone,agriculture",
    "soil,agriculture",
    "seedling,field",
    "smartfarming,technology",
]


def fetch_image(url: str) -> tuple[bytes, str]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        content_type = response.headers.get_content_type()
        if content_type != "image/jpeg":
            raise RuntimeError(f"unexpected content type: {content_type}")
        final_url = response.geturl()
        return response.read(), final_url


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "public" / "assets" / "agri-gallery"
    output_dir.mkdir(parents=True, exist_ok=True)

    for existing in output_dir.glob("agri-*.jpg"):
        existing.unlink(missing_ok=True)
    metadata_path = output_dir / "metadata.json"
    metadata_path.unlink(missing_ok=True)

    seen_hashes: set[str] = set()
    downloaded: list[dict] = []

    attempt = 0
    while len(downloaded) < TARGET_COUNT and attempt < MAX_ATTEMPTS:
        attempt += 1
        tags = TAG_SETS[(attempt - 1) % len(TAG_SETS)]
        seed = random.randint(1, 10_000_000)
        url = (
            f"https://loremflickr.com/{BASE_WIDTH}/{BASE_HEIGHT}/"
            f"{urllib.parse.quote(tags, safe=',')}?random={seed}"
        )

        try:
            image_bytes, final_url = fetch_image(url)
        except (HTTPError, URLError, TimeoutError, RuntimeError) as error:
            if attempt % 20 == 0:
                print(f"attempt {attempt}: transient fetch failure ({error})")
            time.sleep(0.2)
            continue

        digest = hashlib.sha1(image_bytes).hexdigest()
        if digest in seen_hashes:
            if attempt % 20 == 0:
                print(f"attempt {attempt}: duplicate image skipped")
            continue
        seen_hashes.add(digest)

        index = len(downloaded) + 1
        filename = f"agri-{index:03d}.jpg"
        destination = output_dir / filename
        destination.write_bytes(image_bytes)

        downloaded.append(
            {
                "file": filename,
                "request_url": url,
                "resolved_url": final_url,
                "tags": tags.split(","),
                "sha1": digest,
                "bytes": len(image_bytes),
            }
        )
        print(f"downloaded {index}/{TARGET_COUNT} -> {filename}")
        time.sleep(0.12)

    if len(downloaded) < TARGET_COUNT:
        raise RuntimeError(
            f"Downloaded only {len(downloaded)} unique images after {attempt} attempts."
        )

    metadata_path.write_text(json.dumps(downloaded, indent=2), encoding="utf-8")
    print(f"Completed: {len(downloaded)} images written to {output_dir}")


if __name__ == "__main__":
    main()
