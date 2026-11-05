"""Tile rendered stills into one contact sheet. usage: tile.py out.jpg cols frame.jpg ..."""
import sys
from PIL import Image
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
W, H = 960, 540
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * W, rows * H), (20, 20, 20))
for i, fn in enumerate(files):
    sheet.paste(Image.open(fn).resize((W, H), Image.LANCZOS), ((i % cols) * W, (i // cols) * H))
sheet.save(out, quality=88)
