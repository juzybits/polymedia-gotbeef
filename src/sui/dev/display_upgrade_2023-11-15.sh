#!/usr/bin/env bash

set -ueo pipefail

PACKAGE=0x8221cc562f8c58c922c6a40ecbc7e2f16b0159fb683470c22e96d21a0dc52beb
DISPLAY=0x1643605b87055f03b3d627eeb2ee5478b332f4169b1a076517673801dd62e802
DISPLAY_TYPE="$PACKAGE::bet::Bet<0x2::sui::SUI>"

edit_display_field() {
    local name=$1
    local value=$2
    sui client call \
     --gas-budget 700700700 \
     --package 0x2 \
     --module display \
     --function edit \
     --type-args "$DISPLAY_TYPE" \
     --args "$DISPLAY" "$name" "$value"
}

update_display_version() {
    sui client call \
     --gas-budget 700700700 \
     --package 0x2 \
     --module display \
     --function update_version \
     --type-args "$DISPLAY_TYPE" \
     --args "$DISPLAY"
}

edit_display_field 'project_url' 'https://gotbeef.polymedia.app'
edit_display_field 'link' 'https://gotbeef.polymedia.app/bet/{id}'
update_display_version
