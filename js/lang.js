/* lang: tekstai 10 kalbų (EN būtina Poki; kitos - didžiausios Poki rinkos). Piešiama didžiosiomis raidėmis pikseliniu šriftu;
   raidės be šrifto (TR İ Ş Ğ) - per NFD į bazinę raidę. Velniūkščio replikos - masyvai (atsitiktinė). */
'use strict';
const LANGS = {
  en: { map: 'MAP', settings: 'SETTINGS', music: 'MUSIC', sounds: 'SOUNDS', language: 'LANGUAGE', back: 'BACK', wn: ['THE DUNGEON', 'WILD WOODS', 'SUN DUNES', 'FROST PEAKS', 'CRYSTAL CAVES', 'HELL'], lang: 'ENGLISH', play: 'PLAY', levels: 'LEVELS', level: 'LEVEL', deaths: 'DEATHS', paused: 'PAUSED', resume: 'RESUME', restart: 'RESTART', menu: 'MENU',
    soundOn: 'SOUND: ON', soundOff: 'SOUND: OFF', skip: 'SKIP LEVEL', replay: 'ALL YOUR TRIES', flawless: 'FLAWLESS!', next: 'NEXT', anyKey: 'PRESS ANY KEY', rotate: 'ROTATE YOUR PHONE',
    world: 'WORLD', soon: 'MORE WORLDS SOON', worldClear: 'WORLD CLEAR!', total: 'TOTAL DEATHS', hint: 'ARROWS / WASD + SPACE',
    heh: ['HEH.', 'HEH HEH.'], mirror: ['OOPS. MIRROR!'], mimic: ['SURPRISE!'], run: ['RUN!'], rise: ['TOO SLOW?'],
    laugh: ['NOPE!', 'HA HA!', 'AGAIN?', 'CLASSIC!', 'TOO EASY!', 'OUCH!', 'NICE TRY!'], angry: ['FINE.', 'LUCKY...', 'GRR!', 'NOT FAIR!'] },
  lt: { map: 'ŽEMĖLAPIS', settings: 'NUSTATYMAI', music: 'MUZIKA', sounds: 'GARSAI', language: 'KALBA', back: 'ATGAL', wn: ['POŽEMIS', 'ŽALIOJI GIRIA', 'SAULĖS KOPOS', 'LEDO VIRŠŪNĖS', 'KRISTALŲ URVAI', 'PRAGARAS'], lang: 'LIETUVIŲ', play: 'ŽAISTI', levels: 'LYGIAI', level: 'LYGIS', deaths: 'MIRTYS', paused: 'PAUZĖ', resume: 'TĘSTI', restart: 'IŠ NAUJO', menu: 'MENIU',
    soundOn: 'GARSAS: ĮJ.', soundOff: 'GARSAS: IŠJ.', skip: 'PRALEISTI', replay: 'VISI TAVO BANDYMAI', flawless: 'BE KLAIDŲ!', next: 'TOLIAU', anyKey: 'SPAUSK BET KĄ', rotate: 'PASUK TELEFONĄ',
    world: 'PASAULIS', soon: 'NETRUKUS DAUGIAU', worldClear: 'PASAULIS ĮVEIKTAS!', total: 'IŠ VISO MIRČIŲ', hint: 'RODYKLĖS / WASD + TARPAS',
    heh: ['CHE.', 'CHE CHE.'], mirror: ['OI. VEIDRODIS!'], mimic: ['SIURPRIZAS!'], run: ['BĖK!'], rise: ['PER LĖTAI?'],
    laugh: ['NE!', 'CHA CHA!', 'DAR KARTĄ?', 'KLASIKA!', 'PER LENGVA!', 'AU!', 'GERAS BANDYMAS!'], angry: ['GERAI.', 'PASISEKĖ...', 'GRR!', 'NESĄŽININGA!'] },
  ru: { map: 'КАРТА', settings: 'НАСТРОЙКИ', music: 'МУЗЫКА', sounds: 'ЗВУКИ', language: 'ЯЗЫК', back: 'НАЗАД', wn: ['ПОДЗЕМЕЛЬЕ', 'ДИКИЙ ЛЕС', 'СОЛНЕЧНЫЕ ДЮНЫ', 'ЛЕДЯНЫЕ ПИКИ', 'КРИСТАЛЬНЫЕ ПЕЩЕРЫ', 'АД'], lang: 'РУССКИЙ', play: 'ИГРАТЬ', levels: 'УРОВНИ', level: 'УРОВЕНЬ', deaths: 'СМЕРТИ', paused: 'ПАУЗА', resume: 'ДАЛЬШЕ', restart: 'ЗАНОВО', menu: 'МЕНЮ',
    soundOn: 'ЗВУК: ВКЛ', soundOff: 'ЗВУК: ВЫКЛ', skip: 'ПРОПУСТИТЬ', replay: 'ВСЕ ТВОИ ПОПЫТКИ', flawless: 'БЕЗ ОШИБОК!', next: 'ДАЛЕЕ', anyKey: 'НАЖМИ ЛЮБУЮ КЛАВИШУ', rotate: 'ПОВЕРНИ ТЕЛЕФОН',
    world: 'МИР', soon: 'СКОРО НОВЫЕ МИРЫ', worldClear: 'МИР ПРОЙДЕН!', total: 'ВСЕГО СМЕРТЕЙ', hint: 'СТРЕЛКИ / WASD + ПРОБЕЛ',
    heh: ['ХЕ.', 'ХЕ-ХЕ.'], mirror: ['УПС. ЗЕРКАЛО!'], mimic: ['СЮРПРИЗ!'], run: ['БЕГИ!'], rise: ['МЕДЛЕННО?'],
    laugh: ['НЕТ!', 'ХА-ХА!', 'ЕЩЁ РАЗ?', 'КЛАССИКА!', 'ЛЕГКО!', 'АЙ!', 'НЕПЛОХО!'], angry: ['ЛАДНО.', 'ПОВЕЗЛО...', 'ГРР!', 'НЕЧЕСТНО!'] },
  es: { map: 'MAPA', settings: 'AJUSTES', music: 'MÚSICA', sounds: 'SONIDOS', language: 'IDIOMA', back: 'VOLVER', wn: ['LA MAZMORRA', 'BOSQUE SALVAJE', 'DUNAS DEL SOL', 'PICOS HELADOS', 'CUEVAS DE CRISTAL', 'INFIERNO'], lang: 'ESPAÑOL', play: 'JUGAR', levels: 'NIVELES', level: 'NIVEL', deaths: 'MUERTES', paused: 'PAUSA', resume: 'SEGUIR', restart: 'REINICIAR', menu: 'MENÚ',
    soundOn: 'SONIDO: SÍ', soundOff: 'SONIDO: NO', skip: 'SALTAR NIVEL', replay: 'TODOS TUS INTENTOS', flawless: '¡PERFECTO!', next: 'SIGUIENTE', anyKey: 'PULSA UNA TECLA', rotate: 'GIRA EL TELÉFONO',
    world: 'MUNDO', soon: 'MÁS MUNDOS PRONTO', worldClear: '¡MUNDO SUPERADO!', total: 'MUERTES TOTALES', hint: 'FLECHAS / WASD + ESPACIO',
    heh: ['JE.', 'JE JE.'], mirror: ['UPS. ¡ESPEJO!'], mimic: ['¡SORPRESA!'], run: ['¡CORRE!'], rise: ['¿MUY LENTO?'],
    laugh: ['¡NOPE!', '¡JA JA!', '¿OTRA VEZ?', '¡CLÁSICO!', '¡FÁCIL!', '¡AY!', '¡BUEN INTENTO!'], angry: ['VALE.', 'SUERTE...', '¡GRR!', '¡TRAMPA!'] },
  pt: { map: 'MAPA', settings: 'AJUSTES', music: 'MÚSICA', sounds: 'SONS', language: 'IDIOMA', back: 'VOLTAR', wn: ['A MASMORRA', 'FLORESTA SELVAGEM', 'DUNAS DO SOL', 'PICOS GELADOS', 'CAVERNAS DE CRISTAL', 'INFERNO'], lang: 'PORTUGUÊS', play: 'JOGAR', levels: 'NÍVEIS', level: 'NÍVEL', deaths: 'MORTES', paused: 'PAUSA', resume: 'CONTINUAR', restart: 'REINICIAR', menu: 'MENU',
    soundOn: 'SOM: LIGADO', soundOff: 'SOM: DESLIG.', skip: 'PULAR NÍVEL', replay: 'TODAS AS TENTATIVAS', flawless: 'PERFEITO!', next: 'PRÓXIMO', anyKey: 'APERTE QUALQUER TECLA', rotate: 'GIRE O CELULAR',
    world: 'MUNDO', soon: 'MAIS MUNDOS EM BREVE', worldClear: 'MUNDO CONCLUÍDO!', total: 'MORTES TOTAIS', hint: 'SETAS / WASD + ESPAÇO',
    heh: ['HEH.', 'HEH HEH.'], mirror: ['OPS. ESPELHO!'], mimic: ['SURPRESA!'], run: ['CORRE!'], rise: ['DEVAGAR?'],
    laugh: ['NOPE!', 'HA HA!', 'DE NOVO?', 'CLÁSSICO!', 'FÁCIL!', 'AI!', 'BOA TENTATIVA!'], angry: ['TÁ BOM.', 'SORTE...', 'GRR!', 'INJUSTO!'] },
  fr: { map: 'CARTE', settings: 'RÉGLAGES', music: 'MUSIQUE', sounds: 'SONS', language: 'LANGUE', back: 'RETOUR', wn: ['LE DONJON', 'BOIS SAUVAGES', 'DUNES DU SOLEIL', 'PICS GELÉS', 'GROTTES DE CRISTAL', 'ENFER'], lang: 'FRANÇAIS', play: 'JOUER', levels: 'NIVEAUX', level: 'NIVEAU', deaths: 'MORTS', paused: 'PAUSE', resume: 'REPRENDRE', restart: 'RECOMMENCER', menu: 'MENU',
    soundOn: 'SON : OUI', soundOff: 'SON : NON', skip: 'PASSER', replay: 'TOUS TES ESSAIS', flawless: 'PARFAIT !', next: 'SUIVANT', anyKey: 'APPUIE SUR UNE TOUCHE', rotate: 'TOURNE TON TÉLÉPHONE',
    world: 'MONDE', soon: "D'AUTRES MONDES BIENTÔT", worldClear: 'MONDE TERMINÉ !', total: 'MORTS AU TOTAL', hint: 'FLÈCHES / WASD + ESPACE',
    heh: ['HÉ.', 'HÉ HÉ.'], mirror: ['OUPS. MIROIR !'], mimic: ['SURPRISE !'], run: ['COURS !'], rise: ['TROP LENT ?'],
    laugh: ['NOPE !', 'HA HA !', 'ENCORE ?', 'CLASSIQUE !', 'TROP FACILE !', 'AÏE !', 'BIEN ESSAYÉ !'], angry: ['BON.', 'CHANCEUX...', 'GRR !', 'PAS JUSTE !'] },
  de: { map: 'KARTE', settings: 'EINSTELLUNGEN', music: 'MUSIK', sounds: 'GERÄUSCHE', language: 'SPRACHE', back: 'ZURÜCK', wn: ['DAS VERLIES', 'WILDER WALD', 'SONNENDÜNEN', 'FROSTGIPFEL', 'KRISTALLHÖHLEN', 'HÖLLE'], lang: 'DEUTSCH', play: 'SPIELEN', levels: 'LEVEL', level: 'LEVEL', deaths: 'TODE', paused: 'PAUSE', resume: 'WEITER', restart: 'NEUSTART', menu: 'MENÜ',
    soundOn: 'TON: AN', soundOff: 'TON: AUS', skip: 'ÜBERSPRINGEN', replay: 'ALLE DEINE VERSUCHE', flawless: 'FEHLERFREI!', next: 'WEITER', anyKey: 'DRÜCKE EINE TASTE', rotate: 'HANDY DREHEN',
    world: 'WELT', soon: 'BALD MEHR WELTEN', worldClear: 'WELT GESCHAFFT!', total: 'TODE GESAMT', hint: 'PFEILE / WASD + LEERTASTE',
    heh: ['HEH.', 'HEH HEH.'], mirror: ['UPS. SPIEGEL!'], mimic: ['ÜBERRASCHUNG!'], run: ['LAUF!'], rise: ['ZU LANGSAM?'],
    laugh: ['NÖ!', 'HA HA!', 'NOCHMAL?', 'KLASSIKER!', 'ZU LEICHT!', 'AUA!', 'NETTER VERSUCH!'], angry: ['SCHÖN.', 'GLÜCK...', 'GRR!', 'UNFAIR!'] },
  it: { map: 'MAPPA', settings: 'IMPOSTAZIONI', music: 'MUSICA', sounds: 'SUONI', language: 'LINGUA', back: 'INDIETRO', wn: ['IL SOTTERRANEO', 'BOSCO SELVAGGIO', 'DUNE DEL SOLE', 'PICCHI GELATI', 'GROTTE DI CRISTALLO', 'INFERNO'], lang: 'ITALIANO', play: 'GIOCA', levels: 'LIVELLI', level: 'LIVELLO', deaths: 'MORTI', paused: 'PAUSA', resume: 'RIPRENDI', restart: 'RICOMINCIA', menu: 'MENU',
    soundOn: 'SUONO: SÌ', soundOff: 'SUONO: NO', skip: 'SALTA LIVELLO', replay: 'TUTTI I TUOI TENTATIVI', flawless: 'PERFETTO!', next: 'AVANTI', anyKey: 'PREMI UN TASTO', rotate: 'RUOTA IL TELEFONO',
    world: 'MONDO', soon: 'ALTRI MONDI IN ARRIVO', worldClear: 'MONDO COMPLETATO!', total: 'MORTI TOTALI', hint: 'FRECCE / WASD + SPAZIO',
    heh: ['EH.', 'EH EH.'], mirror: ['OPS. SPECCHIO!'], mimic: ['SORPRESA!'], run: ['CORRI!'], rise: ['TROPPO LENTO?'],
    laugh: ['NOPE!', 'AH AH!', 'ANCORA?', 'CLASSICO!', 'TROPPO FACILE!', 'AHI!', 'BEL TENTATIVO!'], angry: ['VA BENE.', 'FORTUNA...', 'GRR!', 'NON VALE!'] },
  pl: { map: 'MAPA', settings: 'USTAWIENIA', music: 'MUZYKA', sounds: 'DŹWIĘKI', language: 'JĘZYK', back: 'WSTECZ', wn: ['LOCHY', 'DZIKI LAS', 'SŁONECZNE WYDMY', 'MROŹNE SZCZYTY', 'KRYSZTAŁOWE JASKINIE', 'PIEKŁO'], lang: 'POLSKI', play: 'GRAJ', levels: 'POZIOMY', level: 'POZIOM', deaths: 'ŚMIERCI', paused: 'PAUZA', resume: 'WZNÓW', restart: 'OD NOWA', menu: 'MENU',
    soundOn: 'DŹWIĘK: WŁ.', soundOff: 'DŹWIĘK: WYŁ.', skip: 'POMIŃ POZIOM', replay: 'WSZYSTKIE TWOJE PRÓBY', flawless: 'BEZBŁĘDNIE!', next: 'DALEJ', anyKey: 'NACIŚNIJ KLAWISZ', rotate: 'OBRÓĆ TELEFON',
    world: 'ŚWIAT', soon: 'WIĘCEJ ŚWIATÓW WKRÓTCE', worldClear: 'ŚWIAT UKOŃCZONY!', total: 'ŚMIERCI ŁĄCZNIE', hint: 'STRZAŁKI / WASD + SPACJA',
    heh: ['HE.', 'HE HE.'], mirror: ['UPS. LUSTRO!'], mimic: ['NIESPODZIANKA!'], run: ['UCIEKAJ!'], rise: ['ZA WOLNO?'],
    laugh: ['NOPE!', 'HA HA!', 'JESZCZE RAZ?', 'KLASYK!', 'ZA ŁATWO!', 'AŁA!', 'NIEZŁA PRÓBA!'], angry: ['DOBRA.', 'FARCIARZ...', 'GRR!', 'NIEFAIR!'] },
  tr: { map: 'HARİTA', settings: 'AYARLAR', music: 'MÜZİK', sounds: 'SESLER', language: 'DİL', back: 'GERİ', wn: ['ZİNDAN', 'VAHŞİ ORMAN', 'GÜNEŞ KUMULLARI', 'BUZ ZİRVELERİ', 'KRİSTAL MAĞARALAR', 'CEHENNEM'], lang: 'TÜRKÇE', play: 'OYNA', levels: 'BÖLÜMLER', level: 'BÖLÜM', deaths: 'ÖLÜM', paused: 'DURAKLATILDI', resume: 'DEVAM', restart: 'YENİDEN', menu: 'MENÜ',
    soundOn: 'SES: AÇIK', soundOff: 'SES: KAPALI', skip: 'BÖLÜMÜ GEÇ', replay: 'TÜM DENEMELERİN', flawless: 'KUSURSUZ!', next: 'İLERİ', anyKey: 'BİR TUŞA BAS', rotate: 'TELEFONU ÇEVİR',
    world: 'DÜNYA', soon: 'YAKINDA YENİ DÜNYALAR', worldClear: 'DÜNYA BİTTİ!', total: 'TOPLAM ÖLÜM', hint: 'OKLAR / WASD + BOŞLUK',
    heh: ['HEH.', 'HEH HEH.'], mirror: ['HOP. AYNA!'], mimic: ['SÜRPRİZ!'], run: ['KOŞ!'], rise: ['ÇOK MU YAVAŞ?'],
    laugh: ['NOPE!', 'HA HA!', 'YİNE Mİ?', 'KLASİK!', 'ÇOK KOLAY!', 'AY!', 'GÜZEL DENEME!'], angry: ['PEKİ.', 'ŞANSLI...', 'GRR!', 'HAKSIZLIK!'] },
};
const LANG_ORDER = ['en', 'lt', 'ru', 'es', 'pt', 'fr', 'de', 'it', 'pl', 'tr'];
let LANG = 'en';
const T = k => { const v = (LANGS[LANG] || LANGS.en)[k]; return v !== undefined ? v : LANGS.en[k] !== undefined ? LANGS.en[k] : k; };
const TR = k => { const v = T(k); return Array.isArray(v) ? pick(v) : v; };
function langInit() {
  let l = save.lang; if (!l) { const n = (navigator.language || 'en').slice(0, 2).toLowerCase(); l = LANGS[n] ? n : 'en'; }
  LANG = LANGS[l] ? l : 'en'; document.documentElement.lang = LANG; const r = document.getElementById('rotT'); if (r) r.textContent = T('rotate');
}
function langSet(l) { LANG = l; save.lang = l; persist(); langInit(); }
function langNext() { LANG = LANG_ORDER[(LANG_ORDER.indexOf(LANG) + 1) % LANG_ORDER.length]; save.lang = LANG; persist(); langInit(); }
