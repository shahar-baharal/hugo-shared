#!/bin/bash
# manager.sh <variant>: panel → settings menu → People and access → Add → email → (Invite ringed, not pressed)
set -u; S=$(dirname "$0"); c=$S/c; v=$1; F=f=/local/business/; M=$(cat $S/mark.js)
if [[ $v == he* ]]; then L=('הצגת הגדרות ותמיכה לגבי פרופיל העסק' 'הגדרות הדף העסקי' 'משתמשים והרשאות גישה' 'הוספה של משתמש לפרופיל העסק בחיפוש ובמפות Google' 'כתובת אימייל' 'הזמנה')
else L=('See Business Profile settings and support' 'Business Profile settings' 'People and access' 'Add a person to your Business Profile on Google Maps & Search' 'Email address' 'Invite'); fi
mk(){ $c eval v=$v $1 js="$M" >/dev/null; $c eval v=$v $1 js="window.__mark('$2')"; $c shot v=$v name=$3 >/dev/null; $c eval v=$v $1 js='window.__unmark()' >/dev/null; }
$c goto v=$v url="https://business.google.com/n/15411665959721460189/searchprofile?hl=${v%%-*}" >/dev/null
$c click v=$v role=button name="${L[0]}" wait=2000 >/dev/null
mk '' "${L[1]}" 12-menu
$c click v=$v role=menuitem name="${L[1]}" exact=1 wait=5000 >/dev/null
mk $F "${L[2]}" 13-settings
$c click v=$v $F role=button name="${L[2]}" wait=4000 >/dev/null || $c click v=$v $F text="${L[2]}" wait=4000 >/dev/null
mk $F "${L[3]}" 14-people
$c click v=$v $F role=button name="${L[3]}" wait=4000 >/dev/null
$c click v=$v $F role=combobox name="${L[4]}" wait=500 >/dev/null
$c type v=$v value='shaharbestbaharal@gmail.com' >/dev/null; $c key v=$v key=Escape >/dev/null
mk $F "${L[5]}" 15-invite
echo " $v done"
