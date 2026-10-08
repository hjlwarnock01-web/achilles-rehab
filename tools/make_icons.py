"""Generate app icons (pure Python, no deps): dark green rounded tile, three
rising bars in the accent green — the tendon rebuilding, step by step.

Outputs icons/icon-512.png, icons/icon-192.png, icons/apple-touch-icon.png (180).
Rerun after any palette change:  python tools/make_icons.py
"""
import struct
import zlib
from pathlib import Path

TILE = (0x0F, 0x1A, 0x14)
BAR = (0x4A, 0x9B, 0x6E)
BAR_HI = (0x7F, 0xC9, 0x9E)
OUTSIDE = (0x0F, 0x1A, 0x14)  # maskable: same as tile so Android crops look clean


def blend(base, top, cov):
    return tuple(int(round(b * (1 - cov) + t * cov)) for b, t in zip(base, top))


def rounded_rect_cov(x, y, x0, y0, x1, y1, r):
    """Coverage (0/1 with soft edge) of point in a rounded rect."""
    if x < x0 or x > x1 or y < y0 or y > y1:
        return 0.0
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
    if d <= r - 1:
        return 1.0
    if d >= r + 1:
        return 0.0
    return (r + 1 - d) / 2.0


def render(size):
    s = size / 512.0
    tile_r = 0.20 * size
    bars = [  # (x0, y0, x1, y1) in 512 space, bottom at 392
        (112, 300, 196, 392),
        (214, 232, 298, 392),
        (316, 136, 400, 392),
    ]
    rows = []
    for yi in range(size):
        row = bytearray()
        for xi in range(size):
            x, y = xi + 0.5, yi + 0.5
            px = OUTSIDE
            cov = rounded_rect_cov(x, y, 0, 0, size, size, tile_r)
            px = blend(px, TILE, cov)
            for i, (bx0, by0, bx1, by1) in enumerate(bars):
                c = rounded_rect_cov(x, y, bx0 * s, by0 * s, bx1 * s, by1 * s, 14 * s)
                if c > 0:
                    px = blend(px, BAR_HI if i == 2 else BAR, c)
            row += bytes(px)
        rows.append(b"\x00" + bytes(row))
    return b"".join(rows)


def png(size, raw):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def main():
    out = Path(__file__).resolve().parent.parent / "icons"
    out.mkdir(exist_ok=True)
    for name, size in (("icon-512.png", 512), ("icon-192.png", 192), ("apple-touch-icon.png", 180)):
        (out / name).write_bytes(png(size, render(size)))
        print("wrote", out / name)


if __name__ == "__main__":
    main()
