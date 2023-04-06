#!/bin/sh
if [ -z "$SHELLY" ] 
then
    echo "IP Address unknown: Environment variable SHELLY is not set, quitting." 2> /dev/stderr
    exit 1
fi

echo "Enabling debug";
curl -X POST -d '{"id":1, "method":"Sys.SetConfig", "params":{"config":{"debug":{"websocket":{"enable":true}}}}}' http://${SHELLY}/rpc

echo "Tailing javascript log";
websocat ws://$SHELLY/debug/log