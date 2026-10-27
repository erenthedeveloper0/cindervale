#!/usr/bin/env bash
# Prints the 16 ANSI colors and the kind of output developers read every day,
# for checking a terminal palette by eye. Run: bash fixtures/terminal-colors.sh
set -euo pipefail

names=(black red green yellow blue magenta cyan white)
printf '\n  normal  '
for i in "${!names[@]}"; do printf '\e[3%dm%-9s\e[0m' "$i" "${names[$i]}"; done
printf '\n  bright  '
for i in "${!names[@]}"; do printf '\e[9%dm%-9s\e[0m' "$i" "${names[$i]}"; done
printf '\n\n'

printf '\e[1m$ git status -sb\e[0m\n'
printf '## \e[32mmain\e[0m...\e[31morigin/main\e[0m [ahead 2]\n'
printf ' \e[31mM\e[0m src/components/project-board.tsx\n'
printf '\e[32mA\e[0m  src/lib/format.ts\n'
printf ' \e[31mD\e[0m src/legacy/budget.js\n'
printf '\e[31m??\e[0m NOTES.md\n\n'

printf '\e[1m$ git diff --stat\e[0m\n'
printf ' src/lib/format.ts | 7 \e[32m+++++\e[0m\e[31m--\e[0m\n'
printf ' 1 file changed, 5 insertions(+), 2 deletions(-)\n\n'

printf '\e[1m$ npx tsc --noEmit\e[0m\n'
printf '\e[96msrc/lib/format.ts\e[0m:\e[93m4\e[0m:\e[93m10\e[0m - \e[91merror\e[0m\e[90m TS2322: \e[0mType '"'"'number'"'"' is not assignable to type '"'"'string'"'"'.\n\n'

printf '\e[1m$ pnpm test\e[0m\n'
printf ' \e[32m✓\e[0m formatBudget \e[2m(3 tests)\e[0m \e[33m12ms\e[0m\n'
printf ' \e[31m✗\e[0m formatHours \e[2m> rounds minutes\e[0m\n'
printf '   \e[31mAssertionError: expected "1h 30m" to equal "1h 29m"\e[0m\n'
printf ' Tests  \e[1;31m1 failed\e[0m | \e[1;32m3 passed\e[0m\n\n'

printf '\e[1m$ pnpm build\e[0m\n'
printf '\e[36m▲ Next.js 16.0.0\e[0m\n'
printf ' \e[33m⚠\e[0m \e[33mCompiled with warnings\e[0m in 4.2s\n'
printf ' \e[32m✓\e[0m Generating static pages \e[2m(12/12)\e[0m\n'
printf ' \e[35m●\e[0m (SSG) prerendered as static content\n'
printf '\e[34mℹ\e[0m npm \e[2mnotice\e[0m New minor version of npm available\n'
