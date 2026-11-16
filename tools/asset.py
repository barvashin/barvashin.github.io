#!/usr/bin/env python3
"""Скачать картинку из Figma (временный URL) в assets/img без дублей.

Использование:  python3 -I tools/asset.py <url> [<url> ...]
Печатает для каждого URL строку:  <url> -> assets/img/<md5>.<ext>
- одинаковые картинки получают одно имя (по md5 содержимого);
- растровые картинки шире 2400 px уменьшаются до 2400 px;
- большие PNG без прозрачности переводятся в JPEG (качество 84).
"""
import hashlib, os, subprocess, sys, tempfile, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets', 'img')
os.makedirs(IMG, exist_ok=True)


def sips(*args):
    return subprocess.run(['sips', *args], capture_output=True, text=True).stdout


def kind(data):
    if data[:4] == b'\x89PNG':
        return 'png'
    if data[:3] == b'\xff\xd8\xff':
        return 'jpg'
    if data[:4] == b'RIFF' and data[8:12] == b'WEBP':
        return 'webp'
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return 'gif'
    head = data[:400].lstrip().lower()
    if head.startswith(b'<svg') or head.startswith(b'<?xml'):
        return 'svg'
    return 'bin'


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    ext = kind(data)
    md5 = hashlib.md5(data).hexdigest()[:14]
    if ext in ('png', 'jpg', 'webp'):
        with tempfile.NamedTemporaryFile(suffix='.' + ext, delete=False) as t:
            t.write(data)
            tmp = t.name
        info = sips('-g', 'pixelWidth', '-g', 'hasAlpha', tmp)
        w = int(info.split('pixelWidth:')[1].split()[0]) if 'pixelWidth:' in info else 0
        alpha = 'hasAlpha: yes' in info
        if w > 2400:
            sips('-Z', '2400', tmp)
        if ext == 'png' and not alpha and os.path.getsize(tmp) > 300_000:
            out = tmp[:-4] + '.jpg'
            sips('-s', 'format', 'jpeg', '-s', 'formatOptions', '84', tmp, '--out', out)
            os.remove(tmp)
            tmp, ext = out, 'jpg'
        dest = os.path.join(IMG, f'{md5}.{ext}')
        if not os.path.exists(dest):
            os.replace(tmp, dest)
        else:
            os.remove(tmp)
    else:
        dest = os.path.join(IMG, f'{md5}.{ext}')
        if not os.path.exists(dest):
            with open(dest, 'wb') as f:
                f.write(data)
    return os.path.relpath(dest, ROOT)


if __name__ == '__main__':
    for u in sys.argv[1:]:
        try:
            print(u, '->', fetch(u))
        except Exception as e:  # noqa
            print(u, '-> ERROR', e)
