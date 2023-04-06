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
eval $(stat -s "$1")
echo $st_size
# upload file chunks todo