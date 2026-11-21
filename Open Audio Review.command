#!/bin/zsh
cd "${0:A:h}"
PYTHON='/Users/bobbytennant/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
if [[ ! -x "$PYTHON" ]]; then PYTHON='/usr/bin/python3'; fi
mkdir -p maintenance/audio-review
if ! /usr/bin/curl -fsS http://127.0.0.1:8901/api/catalog >/dev/null 2>&1; then
  nohup "$PYTHON" audio-review/server.py >>maintenance/audio-review/server.log 2>&1 </dev/null &
  for attempt in {1..50}; do
    /usr/bin/curl -fsS http://127.0.0.1:8901/api/catalog >/dev/null 2>&1 && break
    sleep 0.1
  done
fi
open http://127.0.0.1:8901/
