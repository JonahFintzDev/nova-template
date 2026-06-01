#!/bin/sh
set -e
cmd="$@"

# dump the env vars as json with jq
# grep to filter brackets or env var with VITE_ in the name
echo -n "ENV_VARS = " > /tmp/vars.js
jq -n env | grep "{\|VITE_\|}" >> /tmp/vars.js

# change permission to the read-only to everyone
chmod 444 /tmp/vars.js
# move to the static folder when the static apps deployed
mv /tmp/vars.js /usr/share/nginx/html/vars.js

# run nginx as usual
exec nginx -g "daemon off;"
