#!/usr/bin/env python3
"""Собирает HTML-страницы сайта из шаблона и кусочков содержимого.

Шапка, мобильное меню и подвал лежат один раз в tools/TEMPLATE.html.
Содержимое каждой страницы — в src/<slug>.html (только то, что внутри <main>).
Список страниц — в tools/pages.json.

Запуск:  python3 -I tools/build.py            — собрать все страницы
         python3 -I tools/build.py index cases — собрать только эти
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL = open(os.path.join(ROOT, 'tools', 'TEMPLATE.html'), encoding='utf-8').read()
PAGES = json.load(open(os.path.join(ROOT, 'tools', 'pages.json'), encoding='utf-8'))

NAV = {
    'about': 'index.html#about', 'cases': 'cases.html', 'articles': 'articles.html',
    'mentorship': 'mentorship.html', 'contacts': 'contacts.html',
}


def version(rel):
    """Короткая метка по содержимому файла (и файлов из его @import).
    Меняется при каждой правке — браузер видит новый адрес и берёт свежий файл, а не старый из кэша."""
    path = os.path.join(ROOT, rel)
    data = open(path, 'rb').read()
    for imp in re.findall(rb'@import url\("([^"]+)"\)', data):
        data += open(os.path.join(os.path.dirname(path), imp.decode()), 'rb').read()
    return hashlib.md5(data).hexdigest()[:8]


def stamp(html, root):
    def repl(m):
        rel = m.group(2)
        return f'{m.group(1)}{root}{rel}?v={version(rel)}"'
    return re.sub(r'((?:href|src)=")' + re.escape(root) + r'(assets/(?:css|js)/[^"?]+\.(?:css|js))"', repl, html)


def build(p):
    src = os.path.join(ROOT, 'src', p['slug'] + '.html')
    if not os.path.exists(src):
        return None
    root = '../' * p['out'].count('/')
    content = open(src, encoding='utf-8').read().replace('{{ROOT}}', root)
    html = (TPL.replace('{{CONTENT}}', content)
               .replace('{{TITLE}}', p['title'])
               .replace('{{DESC}}', p['desc'])
               .replace('{{PAGE}}', p['css'])
               .replace('{{ROOT}}', root))
    act = p.get('active')
    if act in NAV:
        href = root + NAV[act]
        html = html.replace(f'<a href="{href}">', f'<a class="is-active" href="{href}" aria-current="page">', 1)
    html = stamp(html, root)
    out = os.path.join(ROOT, p['out'])
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w', encoding='utf-8').write(html)
    return p['out']


if __name__ == '__main__':
    only = set(sys.argv[1:])
    done = [build(p) for p in PAGES if not only or p['slug'] in only]
    print('собрано:', ', '.join(d for d in done if d) or 'ничего')
