#!/usr/bin/env python3
"""Capa composta do Pai Indica (comparativo, lista ou review única): 1 a 3 fotos oficiais lado a
lado, cada uma num cartão branco com sombra, sobre fundo degradê areia -> azul-petróleo clareado,
com o nome do modelo escrito embaixo, rótulo "PAI INDICA" no topo e barra âmbar no rodapé.
Saída 1280x720 em public/images/covers/<slug>.jpg (doc 04 §6; cores do CLAUDE.md §9).

Uso (a partir da raiz do repositório), 1 a 3 produtos (1 = review única; lista com mais de 3:
usar os 3 primeiros do ranking):
  python3 scripts/rotina/cover_cmp.py <slug> "Nome 1=<url ou arquivo>" ["Nome 2=..."] ["Nome 3=..."]

Depois grave no post: cover_image_url = /images/covers/<slug>.jpg (commitar o JPG no PR).
Precisa de Pillow (pip install pillow). O nome é escrito por este script, nunca gerado por IA.
Fonte: Barlow Condensed (scripts/rotina/fonts/BarlowCondensed-Bold.ttf, se baixada), senão DejaVu.
Adaptado de /home/user/vocacaodemae/scripts/rotina/cover_cmp.py (somente leitura).
"""
import io
import os
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1280, 720
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_COND = os.path.join("scripts", "rotina", "fonts", "BarlowCondensed-Bold.ttf")
OUT_DIR = os.path.join("public", "images", "covers")
BAR_H = 10                       # barra âmbar de marca no rodapé
TOP_Y = 92                       # topo dos cartões (abaixo do rótulo "PAI INDICA")
BOTTOM_PAD = 64
SAND = (244, 239, 230)           # #F4EFE6
PETROL_LIGHT = (205, 222, 225)   # petróleo a ~20% sobre areia
PETROL = (20, 80, 92)            # #14505C
AMBER = (217, 130, 43)           # #D9822B
GRAPHITE = (31, 36, 41)          # #1F2429


def font_path() -> str:
    return FONT_COND if os.path.exists(FONT_COND) else FONT_BOLD


def load(src: str) -> Image.Image:
    if src.startswith("http"):
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
        data = urllib.request.urlopen(req, timeout=40).read()
        return Image.open(io.BytesIO(data)).convert("RGB")
    return Image.open(src).convert("RGB")


def gradient() -> Image.Image:
    # 1) Degradê de fundo: areia -> azul-petróleo clareado (era rosado no Vocação de Mãe)
    top, bottom = SAND, PETROL_LIGHT
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        row = tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = row
    return img


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=font) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main() -> None:
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    slug = sys.argv[1]
    items = []
    for arg in sys.argv[2:]:
        name, _, src = arg.partition("=")
        if not src:
            sys.exit(f"Item inválido (use Nome=url): {arg}")
        items.append((name.strip(), load(src.strip())))
    n = len(items)
    if n not in (1, 2, 3):
        sys.exit("Use 1, 2 ou 3 produtos.")

    canvas = gradient()
    gap, margin = 36, 56
    card_w = min((W - 2 * margin - gap * (n - 1)) // n, 640)
    x0 = (W - (n * card_w + gap * (n - 1))) // 2
    # 6) Altura útil dos cartões diminui por causa do rótulo e da barra
    card_h = H - TOP_Y - BOTTOM_PAD - BAR_H
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for i in range(n):
        x = x0 + i * (card_w + gap)
        # 2) Sombra dos cartões em petróleo escuro
        sd.rounded_rectangle((x, TOP_Y + 14, x + card_w, TOP_Y + card_h + 14), 28, fill=PETROL + (70,))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow)
    draw = ImageDraw.Draw(canvas)

    label_h = 112
    for i, (name, photo) in enumerate(items):
        x = x0 + i * (card_w + gap)
        y = TOP_Y
        draw.rounded_rectangle((x, y, x + card_w, y + card_h), 28, fill=(255, 255, 255, 255))
        box_w, box_h = card_w - 56, card_h - label_h - 40
        photo.thumbnail((box_w, box_h), Image.LANCZOS)
        px_ = x + (card_w - photo.width) // 2
        py_ = y + 24 + (box_h - photo.height) // 2
        canvas.paste(photo, (px_, py_))
        size = 34
        while size >= 20:
            font = ImageFont.truetype(font_path(), size)
            lines = wrap(draw, name, font, card_w - 48)
            if len(lines) <= 2:
                break
            size -= 2
        ty = y + card_h - label_h + (label_h - len(lines) * (size + 6)) // 2 - 4
        for line in lines:
            tw = draw.textlength(line, font=font)
            # 3) Cor do nome do modelo: grafite
            draw.text((x + (card_w - tw) / 2, ty), line, font=font, fill=GRAPHITE + (255,))
            ty += size + 6

    # 4) Barra âmbar de marca no rodapé + rótulo "PAI INDICA" (petróleo) no topo
    draw.rectangle((0, H - BAR_H, W, H), fill=AMBER + (255,))
    label_font = ImageFont.truetype(font_path(), 26)
    draw.text((56, 18), "PAI INDICA", font=label_font, fill=PETROL + (255,))

    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"{slug}.jpg")
    canvas.convert("RGB").save(out, "JPEG", quality=88, optimize=True)
    print(f"/images/covers/{slug}.jpg  ({os.path.getsize(out) // 1024} KB)")


if __name__ == "__main__":
    main()
