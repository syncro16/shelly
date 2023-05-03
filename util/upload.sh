#!/bin/sh
if [ -z "$1" ] || [ -z "$2" ] 
then
    echo "Usage: $0 filename.js slot_id" 2> /dev/stderr
    exit 1
fi
if [ ! -f "$1" ] 
then
    echo "$1: not found" 2> /dev/stderr
    exit 1
fi
if [ "`which jo`" = "" ]
then
    echo "dependency not met: command 'jo' not found" 2> /dev/stderr
    exit 1
fi
if [ "`which curl`" = "" ]
then
    echo "dependency not met: command 'curl' not found" 2> /dev/stderr
    exit 1
fi
if [ -z "$SHELLY" ] 
then
    echo "IP Address unknown: Environment variable SHELLY is not set, quitting." 2> /dev/stderr
    exit 1
fi

eval $(stat -s "$1")
chunks=$(( ($st_size +1) / 1024 ))

for chunk in `seq 0 1 $chunks`; do
    # upload 1k chunks
    if [ $chunk -eq 0 ] 
    then
        append="false"
    else
        append="true"
    fi
    dd if="$1" of=/dev/stdout bs=1024 iseek=$chunk count=1 2> /dev/null > /tmp/chunk
    jo id=$2 append=$append code=@/tmp/chunk > /tmp/chunk.json
    echo "uploading $chunk / $chunks ... "
    curl http://$SHELLY/rpc/Script.PutCode -H 'Content-Type: application/json' -d @/tmp/chunk.json 
done

rm /tmp/chunk
rm /tmp/chunk.json

curl http://$SHELLY/rpc/Script.Stop -H 'Content-Type: application/json' -d "{id:$2}"
curl http://$SHELLY/rpc/Script.Start -H 'Content-Type: application/json' -d "{id:$2}"
