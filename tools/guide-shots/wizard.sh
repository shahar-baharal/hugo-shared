#!/bin/bash
# wizard.sh <variant>: walks Google's create-profile wizard, ringing what to press on
# each screen. Stops on the contact screen: its Next creates the profile.
set -u; S=$(dirname "$0"); c=$S/c; v=$1; M=$(cat $S/mark.js); full=$([[ $v == *phone ]] && echo 1 || echo 0)
if [[ $v == he* ]]; then h=he; ADD='להוספת העסק ל-Google'; NAME='שם העסק*'; BN='בהר"ל'; NEW='~יצירת עסק בשם זה'; CAT='קטגוריה של העסק*'; CV='מעצב אתרים'; NO='לא'; NX='הבא'; AREA='חיפוש ובחירה של אזורים'; AV='ישראל'; PH='מספר טלפון'; WEB='אתר (אופציונלי)'; CHAT="צ'אט"; WA='כתובת URL להתחלת שיחה בקליק בוואטסאפ'
else h=en; ADD='Add your business to Google'; NAME='Business name*'; BN='Baharal'; NEW='~Create a business with this name'; CAT='Business category*'; CV='Website designer'; NO='No'; NX='Next'; AREA='Search and select areas'; AV='Israel'; PH='Phone number'; WEB='Website (optional)'; CHAT='Chat'; WA='WhatsApp click to chat URL'; fi
mk(){ $c eval v=$v js="$M" >/dev/null; echo -n "$2:$($c eval v=$v js="window.__mark('$1')") "; $c shot v=$v name=$2 full=${3:-0} >/dev/null; $c eval v=$v js='window.__unmark()' >/dev/null; }
$c goto v=$v url="https://business.google.com/create?hl=$h" >/dev/null
mk "$ADD" 01-start
$c click v=$v role=button name="$ADD" >/dev/null
$c click v=$v role=combobox name="$NAME" wait=500 >/dev/null; $c type v=$v value="$BN" >/dev/null
mk "$NEW" 02-name
$c click v=$v role=option name="${NEW#\~}" >/dev/null
$c click v=$v role=combobox name="$CAT" wait=600 >/dev/null; $c type v=$v value="$CV" >/dev/null
mk "$CV" 03-category
$c click v=$v role=option name="$CV" exact=1 >/dev/null
mk "$NX" 04-name-category-done
$c click v=$v role=button name="$NX" exact=1 wait=3500 >/dev/null
$c click v=$v role=radio name="$NO" exact=1 wait=800 >/dev/null
mk "$NO" 05-location-no
$c click v=$v role=button name="$NX" exact=1 wait=3500 >/dev/null
$c click v=$v role=combobox name="$AREA" wait=600 >/dev/null; $c type v=$v value="$AV" >/dev/null
mk "$AV" 06-area-type
$c click v=$v role=option name="$AV" exact=1 wait=1500 >/dev/null
mk "$NX" 07-area-done
$c click v=$v role=button name="$NX" exact=1 wait=3500 >/dev/null
$c click v=$v role=textbox name="$PH" exact=1 wait=300 >/dev/null; $c type v=$v value='054-555-1234' >/dev/null
$c click v=$v role=textbox name="$WEB" wait=300 >/dev/null; $c type v=$v value='https://baharal.com' >/dev/null
$c click v=$v role=combobox name="$CHAT" wait=1000 >/dev/null; $c click v=$v role=option name='WhatsApp Icon WhatsApp' wait=1000 >/dev/null
$c fill v=$v role=textbox name="$WA" value='https://wa.me/972545551234' >/dev/null; $c key v=$v key=Tab >/dev/null
mk "$NX" 08-contact $full
echo "| $v stopped before the creating Next"
