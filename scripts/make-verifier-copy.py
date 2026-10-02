# Usage: python3 scripts/make-verifier-copy.py <entry.md> <copy.md>
# Writes a copy of an entry without its review block, for an independent verifier.
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
text = open(src).read()
m = re.match(r'^---\n(.*?)\n---\n(.*)$', text, re.S)
frontmatter, body = m.group(1), m.group(2)
frontmatter = re.sub(r'\nreview:\n(?:  .*\n?)*', '\n', frontmatter + '\n').rstrip()
open(dst, 'w').write('---\n' + frontmatter + '\n---\n' + body)
print('wrote', dst)
