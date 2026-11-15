"""
Génère les icônes provisoires de la PWA (phase placeholders).

Monogramme typographique sobre, aux couleurs de l'interface : pas d'illustration
tant que les visuels définitifs n'existent pas (étape 4). À relancer si la
charte change :  python3 tools/generate-icons.py

Dépendances : Pillow, et une police serif (Liberation Serif par défaut).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'public' / 'icons'
FONT = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
NAVY = (14, 20, 32)      # GAME.backgroundColor
STONE = (207, 198, 180)  # UI.colors.stone
RULE = (107, 101, 87)    # liseré des panneaux
SS = 4                   # suréchantillonnage, pour des bords nets


def icon(size, *, safe=1.0, border=True):
    """`safe` = fraction centrale occupée par le motif (0.8 pour une icône maskable)."""
    s = size * SS
    img = Image.new('RGB', (s, s), NAVY)
    d = ImageDraw.Draw(img)
    box = s * safe
    origin = (s - box) / 2

    if border:
        inset = box * 0.11
        d.rectangle(
            [origin + inset, origin + inset, origin + box - inset, origin + box - inset],
            outline=RULE, width=max(1, round(box * 0.012)),
        )

    font = ImageFont.truetype(FONT, round(box * 0.44))
    left, top, right, bottom = d.textbbox((0, 0), 'PR', font=font)
    x = (s - (right - left)) / 2 - left
    y = (s - (bottom - top)) / 2 - top - box * 0.035
    d.text((x, y), 'PR', font=font, fill=STONE)

    # Filet sous le monogramme, rappel de la ligne de sol
    rule_w = box * 0.3
    rule_y = y + bottom + box * 0.06
    d.rectangle([(s - rule_w) / 2, rule_y, (s + rule_w) / 2, rule_y + max(1, box * 0.014)], fill=STONE)

    return img.resize((size, size), Image.LANCZOS)


OUT.mkdir(parents=True, exist_ok=True)
icon(192).save(OUT / 'icon-192.png', optimize=True)
icon(512).save(OUT / 'icon-512.png', optimize=True)
# Maskable : le système rogne en rond ou en carré arrondi, le motif reste dans les 80 % centraux.
icon(512, safe=0.8, border=False).save(OUT / 'icon-maskable-512.png', optimize=True)
icon(180, safe=0.9, border=False).save(OUT / 'apple-touch-icon.png', optimize=True)
icon(48, border=False).save(OUT / 'favicon-48.png', optimize=True)
for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size, 'octets')
