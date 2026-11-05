"""Pack the stills from scripts/slides.mjs into one PDF deck.

usage: slides_pdf.py [out.pdf] [slides dir]      (defaults: out/MI50_MV_slides.pdf, out/slides)

Every page is lossless: a palette image when the frame has at most 256 colours (the paper-and-ink
frames usually do), plain RGB otherwise (pages with sprites). The PNG's compressed IDAT stream goes
into the PDF as is (FlateDecode with the PNG predictor), so nothing is re-encoded and edges stay sharp.
Pages are 960 × 540 pt (a 16:9 slide); chapter openings get bookmarks.
"""
import glob
import io
import os
import struct
import sys

import numpy as np
from PIL import Image

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/MI50_MV_slides.pdf'
DIR = sys.argv[2] if len(sys.argv) > 2 else 'out/slides'
TITLE = '榨干一张 MI50 · MI50老矣 尚能饭否'
SUBJECT = 'LFM3-1.7B 在 AMD Radeon Instinct MI50 上的推理优化：显存带宽、每 token 字节与 DSpark'
PAGE_W, PAGE_H = 960, 540
BOOKMARKS = {
    'intro': '序 · 这条式子',
    'hw_title': '第一章 · 一条路',
    'llm_title': '第二章 · 一张账单',
    'run_title': '第三章 · 先读对',
    'go_title': '第四章 · 读得满',
    'ds_title': '第五章 · 读得值',
    'fin_result': '尾声 · 七天的账',
}


def page_png(path):
    """→ (width, height, bit depth, palette bytes or b'' for RGB, zlib stream, colour count)"""
    rgb = Image.open(path).convert('RGB')
    a = np.asarray(rgb).reshape(-1, 3).astype(np.uint32)
    packed = (a[:, 0] << 16) | (a[:, 1] << 8) | a[:, 2]
    uniq, idx = np.unique(packed, return_inverse=True)
    if len(uniq) <= 256:
        im = Image.frombytes('P', rgb.size, idx.astype(np.uint8).tobytes())
        pal = np.stack([(uniq >> 16) & 255, (uniq >> 8) & 255, uniq & 255], 1).astype(np.uint8)
        im.putpalette(pal.tobytes())
    else:
        im = rgb
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    data = buf.getvalue()
    pos, idat, plte, depth = 8, [], b'', 8
    while pos < len(data):
        n, kind = struct.unpack('>I4s', data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if kind == b'IHDR':
            w, h, depth, ctype = struct.unpack('>IIBB', body[:10])
            assert ctype in (2, 3), 'expected an RGB or indexed PNG'
        elif kind == b'PLTE':
            plte = body
        elif kind == b'IDAT':
            idat.append(body)
        pos += 12 + n
    return w, h, depth, plte if ctype == 3 else b'', b''.join(idat), len(uniq)


def pdf_text(s):
    """a PDF text string in UTF-16BE"""
    return '<FEFF' + s.encode('utf-16-be').hex().upper() + '>'


def main():
    files = sorted(glob.glob(os.path.join(DIR, '*.png')))
    if not files:
        sys.exit(f'no PNG in {DIR}; run node scripts/slides.mjs first')
    objs = {}  # number → bytes

    def obj(n, body):
        objs[n] = body if isinstance(body, bytes) else body.encode('latin-1')

    # 1 catalog, 2 pages, 3 info, 4 outlines; pages start at 5, three objects each
    kids, marks, rgb = [], [], []
    for i, fn in enumerate(files):
        w, h, depth, plte, stream, ncol = page_png(fn)
        if not plte:
            rgb.append((os.path.basename(fn), ncol))
        page, content, image = 5 + 3 * i, 6 + 3 * i, 7 + 3 * i
        kids.append(f'{page} 0 R')
        cs = f'[/Indexed /DeviceRGB {len(plte) // 3 - 1} <{plte.hex().upper()}>]' if plte else '/DeviceRGB'
        colors = 1 if plte else 3
        head = (f'<< /Type /XObject /Subtype /Image /Width {w} /Height {h} /ColorSpace {cs} /BitsPerComponent {depth} '
                f'/Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors {colors} /BitsPerComponent {depth} /Columns {w} >> '
                f'/Length {len(stream)} >>\nstream\n')
        obj(image, head.encode('latin-1') + stream + b'\nendstream')
        draw = f'q {PAGE_W} 0 0 {PAGE_H} 0 0 cm /Im0 Do Q'.encode('latin-1')
        obj(content, f'<< /Length {len(draw)} >>\nstream\n'.encode('latin-1') + draw + b'\nendstream')
        obj(page, f'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] /Resources << /XObject << /Im0 {image} 0 R >> >> /Contents {content} 0 R >>')
        shot = os.path.basename(fn)[3:-4]
        if shot in BOOKMARKS and all(m[1] != BOOKMARKS[shot] for m in marks):
            marks.append((page, BOOKMARKS[shot]))

    first = 5 + 3 * len(files)
    for k, (page, title) in enumerate(marks):
        n = first + k
        link = f'/Parent 4 0 R /Title {pdf_text(title)} /Dest [{page} 0 R /Fit]'
        if k > 0:
            link += f' /Prev {n - 1} 0 R'
        if k < len(marks) - 1:
            link += f' /Next {n + 1} 0 R'
        obj(n, f'<< {link} >>')
    obj(4, f'<< /Type /Outlines /First {first} 0 R /Last {first + len(marks) - 1} 0 R /Count {len(marks)} >>')
    obj(1, '<< /Type /Catalog /Pages 2 0 R /Outlines 4 0 R /PageMode /UseOutlines >>')
    obj(2, f'<< /Type /Pages /Kids [{" ".join(kids)}] /Count {len(kids)} >>')
    obj(3, f'<< /Title {pdf_text(TITLE)} /Subject {pdf_text(SUBJECT)} /Creator (scripts/slides_pdf.py) >>')

    out = bytearray(b'%PDF-1.5\n%\xe2\xe3\xcf\xd3\n')
    offsets = {}
    for n in sorted(objs):
        offsets[n] = len(out)
        out += f'{n} 0 obj\n'.encode('latin-1') + objs[n] + b'\nendobj\n'
    xref = len(out)
    top = max(objs) + 1
    out += f'xref\n0 {top}\n0000000000 65535 f \n'.encode('latin-1')
    for n in range(1, top):
        out += f'{offsets[n]:010d} 00000 n \n'.encode('latin-1')
    out += f'trailer\n<< /Size {top} /Root 1 0 R /Info 3 0 R >>\nstartxref\n{xref}\n%%EOF\n'.encode('latin-1')
    with open(OUT, 'wb') as fh:
        fh.write(out)
    print(f'{OUT}: {len(files)} pages, {len(out) / 1e6:.2f} MB, {len(marks)} bookmarks')
    for name, n in rgb:
        print(f'  {name}: {n} colours, stored as RGB')


if __name__ == '__main__':
    main()
