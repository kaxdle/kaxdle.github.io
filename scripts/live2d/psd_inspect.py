#!/usr/bin/env python3
"""Kiểm tra (và sửa nhẹ) PSD trước khi đưa vào psd2live.

Đọc PSD do See-through xuất ra, đối chiếu tên layer với bảng nhận diện của
psd2live (docs/zh/spec/PSD_LAYER_SPEC.md), rồi báo:
  - layer nhận ra / không nhận ra, kèm phía trái-phải theo tên;
  - bộ phận quan trọng còn thiếu (mặt, mắt, miệng, tóc);
  - mắt chưa tách trái/phải, thứ tự eyewhite -> irides -> eyelash sai;
  - layer rỗng, kích thước canvas bất thường.

Có thể đổi tên, xoá layer và ghi ra PSD mới.

Cần: Python 3.10+, `pip install psd-tools` (môi trường see_through đã có sẵn).

Ví dụ:
  python scripts/live2d/psd_inspect.py Dania.psd
  python scripts/live2d/psd_inspect.py Dania.psd --json report.json
  python scripts/live2d/psd_inspect.py Dania.psd --rename "hairf=front hair" --out Dania.fixed.psd
  python scripts/live2d/psd_inspect.py Dania.psd --drop "ears-r" --move-above "eyelash-r=irides-r" --out Dania.fixed.psd
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from psd_tools import PSDImage
except ImportError:  # pragma: no cover
    sys.exit("Thiếu psd-tools: pip install psd-tools")

# Tag và bí danh của psd2live (rút gọn từ PSD_LAYER_SPEC.md, nhánh master 2026-10).
TAGS: dict[str, list[str]] = {
    "BACK_HAIR": ["back hair", "backhair", "后发", "后髪", "后脑勺", "뒷머리"],
    "FRONT_HAIR": ["front hair", "fronthair", "前发", "前髪", "刘海", "앞머리"],
    "HEADWEAR": ["headwear", "帽子", "头饰", "頭飾", "모자"],
    "FACE": ["face", "脸", "臉", "脸部", "얼굴"],
    "FACE_DETAIL": ["facedetail", "face detail", "脸部细节", "面部细节", "腮红", "볼터치"],
    "IRIDES": ["irides", "iris", "瞳孔", "虹膜", "眼珠", "눈동자"],
    "EYEBROW": ["eyebrow", "眉毛", "眉", "まゆ毛", "눈썹"],
    "EYEWHITE": ["eyewhite", "眼白", "白眼", "白目", "흰자"],
    "EYELASH": ["eyelash", "睫毛", "まつ毛", "まつげ", "속눈썹"],
    "EYE_CLOSE": ["eye close", "闭眼", "閉眼", "目閉じ", "감은 눈"],
    "EYEWEAR": ["eyewear", "眼镜", "眼鏡", "めがね", "안경"],
    "EARS": ["ears", "ear", "耳朵", "耳", "みみ", "귀"],
    "EARWEAR": ["earwear", "耳环", "耳環", "耳饰", "귀걸이"],
    "NOSE": ["nose", "鼻子", "鼻", "はな", "코"],
    "MOUTH_OPEN": ["mouth open", "张嘴", "張嘴", "开口", "벌린 입"],
    "MOUTH_CLOSE": ["mouth close", "闭嘴", "閉嘴", "闭口", "다문 입"],
    "MOUTH": ["mouth", "口", "嘴", "嘴巴", "입"],
    "TOOTH_T": ["tooth-t", "上牙", "上歯", "上齿", "윗니"],
    "TOOTH_B": ["tooth-b", "下牙", "下歯", "下齿", "아랫니"],
    "TONGUE": ["tongue", "舌头", "舌頭", "舌", "혀"],
    "NECK": ["neck", "脖子", "颈部", "頸部", "목"],
    "NECKWEAR": ["neckwear", "领饰", "領飾", "围巾", "목도리"],
    "TOPWEAR": ["topwear", "上衣", "衣服", "服装", "상의"],
    "HANDWEAR": ["handwear", "手臂", "手", "腕", "팔"],
    "BOTTOMWEAR": ["bottomwear", "下装", "下裝", "裤子", "치마"],
    "LEGWEAR": ["legwear", "腿", "大腿", "小腿", "다리"],
    "FOOTWEAR": ["footwear", "脚", "腳", "鞋", "신발"],
    "TAIL": ["tail", "尾巴", "尾", "しっぽ", "꼬리"],
    "WINGS": ["wings", "翅膀", "翼", "つばさ", "날개"],
    "OBJECTS": ["objects", "道具", "物件", "소품"],
}
# Tag thô See-through có thể để lại, kèm tên psd2live tương ứng.
SEETHROUGH_RENAMES = {"hairf": "front hair", "hairb": "back hair", "eyebg": "eyewhite"}
REQUIRED = ["FACE", "EYEWHITE", "IRIDES", "EYELASH", "EYEBROW", "FRONT_HAIR", "BACK_HAIR"]
PAIRED = ["EYEWHITE", "IRIDES", "EYELASH", "EYEBROW"]
EYE_ORDER = ["EYEWHITE", "IRIDES", "EYELASH"]  # từ dưới lên

SIDE_PATTERNS = [
    (re.compile(r"[\s_\-(]+(?:l|left)\)?$"), "L"),
    (re.compile(r"[\s_\-(]+(?:r|right)\)?$"), "R"),
    (re.compile(r"^(?:左|왼쪽)\s*"), "L"),
    (re.compile(r"^(?:右|오른쪽)\s*"), "R"),
    (re.compile(r"[\s_\-(]+좌\)?$"), "L"),
    (re.compile(r"[\s_\-(]+우\)?$"), "R"),
]
COPY_SUFFIX = re.compile(r"(\s*(copy|拷贝|のコピー)\s*\d*)$", re.I)
TRAILING_NUM = re.compile(r"[\s_\-]*\d+$")


def classify(name: str) -> tuple[str, str | None]:
    """Trả về (tag, side). tag = 'UNKNOWN' nếu không khớp bí danh nào."""
    base = COPY_SUFFIX.sub("", name.strip().lower())
    base = TRAILING_NUM.sub("", base)
    side = None
    for pattern, s in SIDE_PATTERNS:
        stripped = pattern.sub("", base)
        if stripped != base and stripped:
            base, side = stripped.strip(" _-"), s
            break
    base = TRAILING_NUM.sub("", base).strip(" _-")
    for tag, aliases in TAGS.items():
        if base in aliases:
            return tag, side
    # Khớp lỏng cho tên tiếng Anh dài hơn, ví dụ "front hair shadow".
    for tag, aliases in TAGS.items():
        for alias in aliases:
            if alias.isascii() and len(alias) > 3 and re.search(rf"\b{re.escape(alias)}\b", base):
                return tag, side
    return "UNKNOWN", side


def walk(group, depth=0, out=None):
    out = [] if out is None else out
    for layer in group:  # psd-tools duyệt từ dưới lên
        out.append((layer, depth))
        if layer.is_group():
            walk(layer, depth + 1, out)
    return out


def inspect(psd: PSDImage) -> dict:
    rows, warnings = [], []
    layers = walk(psd)
    for index, (layer, depth) in enumerate(layers):
        if layer.is_group():
            rows.append({"index": index, "name": layer.name, "group": True, "depth": depth})
            continue
        tag, side = classify(layer.name)
        left, top, right, bottom = layer.bbox
        empty = right <= left or bottom <= top
        rows.append({
            "index": index, "name": layer.name, "group": False, "depth": depth,
            "tag": tag, "side": side, "visible": layer.visible, "empty": empty,
            "bbox": [left, top, right, bottom],
        })
        if empty:
            warnings.append(f"Layer rỗng: '{layer.name}'")

    pixel = [r for r in rows if not r["group"]]
    tags = {r["tag"] for r in pixel}
    missing = [t for t in REQUIRED if t not in tags]
    if "MOUTH" not in tags and "MOUTH_OPEN" not in tags:
        missing.append("MOUTH (miệng mở tối đa)")
    for t in missing:
        warnings.append(f"Thiếu bộ phận: {t}")

    for tag in PAIRED:
        items = [r for r in pixel if r["tag"] == tag]
        if items and not any(r["side"] for r in items):
            warnings.append(f"{tag}: {len(items)} layer chưa có hậu tố trái/phải (-l/-r); psd2live sẽ coi là một bộ phận")

    for side in ("L", "R", None):
        positions = {}
        for r in pixel:
            if r["tag"] in EYE_ORDER and r["side"] == side:
                positions.setdefault(r["tag"], r["index"])
        present = [t for t in EYE_ORDER if t in positions]
        if [positions[t] for t in present] != sorted(positions[t] for t in present):
            label = {"L": "trái", "R": "phải", None: "không rõ phía"}[side]
            warnings.append(f"Mắt {label}: thứ tự từ dưới lên phải là eyewhite -> irides -> eyelash")

    # psd2live: trái/phải là của nhân vật, nên phần "-l" thường nằm bên phải màn hình.
    for tag in PAIRED + ["HANDWEAR", "EARS"]:
        lefts = [r for r in pixel if r["tag"] == tag and r["side"] == "L" and not r["empty"]]
        rights = [r for r in pixel if r["tag"] == tag and r["side"] == "R" and not r["empty"]]
        if len(lefts) == 1 and len(rights) == 1:
            cx = lambda r: (r["bbox"][0] + r["bbox"][2]) / 2
            if cx(lefts[0]) < cx(rights[0]):
                warnings.append(
                    f"{tag}: '{lefts[0]['name']}' nằm bên trái màn hình so với '{rights[0]['name']}'. "
                    "psd2live hiểu trái/phải theo nhân vật (bên trái nhân vật = bên phải màn hình): kiểm tra xem có cần đổi tên hai layer cho nhau")

    unknown = [r["name"] for r in pixel if r["tag"] == "UNKNOWN"]
    if unknown:
        warnings.append(f"{len(unknown)} layer không khớp tên psd2live: {', '.join(unknown)}")
    suggestions = {r["name"]: SEETHROUGH_RENAMES[r["name"].lower()] for r in pixel if r["name"].lower() in SEETHROUGH_RENAMES}
    if any(r["group"] for r in rows):
        warnings.append("PSD có group: kiểm tra psd2live nhận đúng, hoặc làm phẳng group")
    w, h = psd.width, psd.height
    if max(w, h) < 1024:
        warnings.append(f"Canvas {w}x{h} nhỏ: mặt sẽ ít pixel, nên dùng ảnh 1280-2048 px")
    if max(w, h) > 4096:
        warnings.append(f"Canvas {w}x{h} lớn hơn 4096")
    return {"size": [w, h], "layers": rows, "warnings": warnings, "suggested_renames": suggestions}


def find_one(psd: PSDImage, name: str):
    found = [layer for layer, _ in walk(psd) if layer.name == name]
    if len(found) != 1:
        sys.exit(f"Cần đúng 1 layer tên '{name}', thấy {len(found)}")
    return found[0]


def apply_fixes(psd: PSDImage, renames: dict[str, str], drops: set[str], moves: list[tuple[str, str]]) -> list[str]:
    """Đổi tên (theo tên gốc, nên đổi chéo hai tên được), xoá, rồi chuyển layer lên ngay trên layer khác."""
    log = []
    for layer, _ in walk(psd):
        if layer.name in renames:
            log.append(f"đổi tên '{layer.name}' -> '{renames[layer.name]}'")
            layer.name = renames[layer.name]
    for layer, _ in reversed(walk(psd)):
        if layer.name in drops:
            layer.parent.remove(layer)
            log.append(f"xoá '{layer.name}'")
    for name, target_name in moves:
        layer, target = find_one(psd, name), find_one(psd, target_name)
        if layer.parent is not target.parent:
            sys.exit(f"'{name}' và '{target_name}' phải nằm cùng một group")
        group = layer.parent
        group.remove(layer)
        group.insert(list(group).index(target) + 1, layer)
        log.append(f"chuyển '{name}' lên ngay trên '{target_name}'")
    return log


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("psd", type=Path)
    ap.add_argument("--json", type=Path, help="ghi báo cáo JSON")
    ap.add_argument("--rename", action="append", default=[], metavar="CŨ=MỚI", help="đổi tên layer (lặp lại được)")
    ap.add_argument("--drop", action="append", default=[], metavar="TÊN", help="xoá layer theo tên (lặp lại được)")
    ap.add_argument("--move-above", action="append", default=[], metavar="TÊN=ĐÍCH", help="chuyển layer TÊN lên ngay trên layer ĐÍCH (lặp lại được)")
    ap.add_argument("--out", type=Path, help="ghi PSD đã sửa ra file này (bắt buộc khi sửa)")
    args = ap.parse_args()

    psd = PSDImage.open(args.psd)
    if args.rename or args.drop or args.move_above:
        if not args.out:
            ap.error("--rename/--drop/--move-above cần --out")
        renames = dict(item.split("=", 1) for item in args.rename)
        moves = [tuple(item.split("=", 1)) for item in args.move_above]
        for line in apply_fixes(psd, renames, set(args.drop), moves):
            print(f"  * {line}")
        psd.save(args.out)
        print(f"Đã ghi {args.out}")
        psd = PSDImage.open(args.out)
        args.psd = args.out

    report = inspect(psd)
    print(f"{args.psd.name}: {report['size'][0]}x{report['size'][1]}, {sum(not r['group'] for r in report['layers'])} layer")
    print("  (thứ tự từ dưới lên)")
    for r in report["layers"]:
        indent = "  " * (r["depth"] + 1)
        if r["group"]:
            print(f"{indent}[group] {r['name']}")
        else:
            side = f" {r['side']}" if r["side"] else ""
            flags = " (rỗng)" if r["empty"] else ""
            print(f"{indent}{r['name']:<28} -> {r['tag']}{side}{flags}")
    if report["suggested_renames"]:
        flags = " ".join(f'--rename "{a}={b}"' for a, b in report["suggested_renames"].items())
        print(f"Gợi ý đổi tên tag thô của See-through:\n  python scripts/live2d/psd_inspect.py <psd> {flags} --out <psd đã sửa>")
    if report["warnings"]:
        print("Cảnh báo:")
        for w in report["warnings"]:
            print(f"  ⚠ {w}")
    else:
        print("Không có cảnh báo.")
    if args.json:
        args.json.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
