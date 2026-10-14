/* SVG 小圖示：每日行程的主題圖示（ICONS）、必去星星（STAR）、備註圖示（NOTE_ICON） */
var ICONS, STAR, NOTE_ICON;
(function(){
  "use strict";
  var INK="#3E3A39", C="#F2A497", Y="#F6D27A", M="#A8D3E6", T="#B9DAA5", P="#FFFCF6";
  function sv(inner){return '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="'+INK+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">'+inner+'</g></svg>';}
  ICONS={
    sky: sv('<rect x="9" y="12" width="11" height="30" fill="'+M+'"/><rect x="28" y="12" width="11" height="30" fill="'+M+'"/><rect x="7" y="7" width="34" height="7" rx="2" fill="'+Y+'"/><circle cx="24" cy="10.5" r="2.5" fill="'+P+'"/><line x1="4" y1="42" x2="44" y2="42"/>'),
    deer: sv('<path d="M17 14 L13 5 M13 9 L9 6 M31 14 L35 5 M35 9 L39 6" fill="none"/><ellipse cx="24" cy="26" rx="11" ry="12" fill="'+Y+'"/><path d="M14 18 L6 15 L12 23 Z M34 18 L42 15 L36 23 Z" fill="'+Y+'"/><circle cx="20" cy="25" r="1.8" fill="'+INK+'" stroke-width="0"/><circle cx="28" cy="25" r="1.8" fill="'+INK+'" stroke-width="0"/><ellipse cx="24" cy="33" rx="3.5" ry="2.5" fill="'+INK+'"/>'),
    torii: sv('<path d="M5 12 Q24 7 43 12 L42 17 L6 17 Z" fill="'+C+'"/><rect x="12" y="17" width="5" height="25" fill="'+C+'"/><rect x="31" y="17" width="5" height="25" fill="'+C+'"/><rect x="9" y="22" width="30" height="5" fill="'+C+'"/><line x1="4" y1="42" x2="44" y2="42"/>'),
    omamori: sv('<path d="M15 14 L33 14 L36 42 L12 42 Z" fill="'+C+'"/><path d="M15 14 Q24 6 33 14" fill="none"/><path d="M20 6 Q24 2 28 6 M24 6 L24 13" fill="none"/><rect x="18" y="22" width="12" height="13" rx="2" fill="'+P+'"/><line x1="21" y1="26" x2="27" y2="26"/><line x1="21" y1="30" x2="27" y2="30"/>'),
    flower: sv('<circle cx="24" cy="12" r="7" fill="'+C+'"/><circle cx="36" cy="22" r="7" fill="'+Y+'"/><circle cx="31" cy="36" r="7" fill="'+M+'"/><circle cx="17" cy="36" r="7" fill="'+T+'"/><circle cx="12" cy="22" r="7" fill="'+C+'"/><circle cx="24" cy="25" r="6" fill="'+P+'"/>'),
    bag: sv('<path d="M10 17 L38 17 L36 42 L12 42 Z" fill="'+Y+'"/><path d="M17 17 Q17 7 24 7 Q31 7 31 17" fill="none"/><circle cx="24" cy="28" r="4" fill="'+C+'"/>'),
    globe: sv('<circle cx="24" cy="24" r="15" fill="'+M+'"/><path d="M9 24 L39 24 M24 9 Q16 24 24 39 M24 9 Q32 24 24 39" fill="none"/><ellipse cx="24" cy="24" rx="21" ry="6" fill="none" transform="rotate(-18 24 24)"/><line x1="16" y1="44" x2="32" y2="44"/>'),
    plane: sv('<path d="M6 24 L34 24 Q44 24 44 27 Q44 30 34 30 L10 30 Z" fill="'+P+'"/><path d="M20 30 L14 42 L21 42 L30 30 M14 24 L9 14 L15 14 L22 24" fill="'+Y+'"/><line x1="32" y1="27" x2="38" y2="27"/>')
  };
  STAR='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 .8 L7.5 4.3 L11.2 4.6 L8.4 7 L9.3 10.8 L6 8.8 L2.7 10.8 L3.6 7 L.8 4.6 L4.5 4.3 Z" fill="#F6D27A"/></svg>';
  NOTE_ICON='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#F6D27A" stroke="#3E3A39" stroke-width="2.5"/><line x1="10" y1="6" x2="10" y2="11" stroke="#3E3A39" stroke-width="2.5" stroke-linecap="round"/><circle cx="10" cy="14.5" r="1.4" fill="#3E3A39"/></svg>';
})();
