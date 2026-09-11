#!/usr/bin/env bash
# Builds ../index.html — one standalone file (CSS + data + app inlined).
# Assets stay external in ../assets/ and are referenced relatively, so the page
# works from file://, a local server, or a Pages subpath (user.github.io/repo/).
set -euo pipefail
cd "$(dirname "$0")"

python3 - <<'PY'
head = open('head.html').read()
src  = open('index.src.html').read()
css  = open('skein-tokens.css').read() + "\n" + open('app.css').read()
data = open('data.js').read()
app  = open('app.js').read()

body = (src.replace('/*__CSS__*/', css)
           .replace('/*__DATA__*/', data)
           .replace('/*__APP__*/', app))

# index.src.html opens with <title>/<link>/<style>…</style>, then markup.
# Close the head and open the body right after that first style block.
marker = '</style>'
i = body.index(marker) + len(marker)
out = head + body[:i] + "\n</head>\n<body>\n" + body[i:] + "\n</body>\n</html>\n"

open('../index.html', 'w').write(out)
print('built ../index.html —', len(out), 'bytes')
PY
