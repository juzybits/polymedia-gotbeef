#!/usr/bin/env bash
#
# Replace src/styles/icons/ with an updated set of icons from fontello.com

DOWNLOADS=$HOME/Downloads

folder_name=${PWD##*/}
if [[ "$folder_name" != 'web' ]]; then
	me=`basename "$0"`
	echo "[$me] Error: call this script only from the 'web' folder"
	exit 1
fi

unzip $DOWNLOADS/fontello-*.zip
rm $DOWNLOADS/fontello-*.zip
rm fontello-*/demo.html
rm fontello-*/README.txt
rm -rf src/styles/icons/
mv fontello-*/ src/styles/icons
