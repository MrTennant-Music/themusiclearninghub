(function (root) {
  "use strict";

  // Teacher-confirmed alternatives for specialist musical vocabulary. These
  // apply to every paper while leaving short, easily confused concepts strict.
  const COMMON_MUSICAL_SPELLINGS = Object.freeze({
    accelerando: ["acelerando", "accelarando", "accellerando", "accelerendo", "acselerando"],
    acciaccatura: ["achaccatura", "aciaccatura", "acciacatura", "acciacattura", "acciaccattura", "acciaccutura"],
    accordion: ["acordian", "acordion", "accordeon", "accordian"],
    adagio: ["adageeo", "adageo", "adaggeo"],
    alberti: ["alberty"],
    allegro: ["allegrow"],
    anacrusis: ["anocrusis"],
    andante: ["andanti"],
    appoggiatura: ["apoggiatura", "appogiatoura", "appogiatura", "appoggiattura"],
    arco: ["arcko"],
    ascending: ["asending"],
    ballet: ["ballett"],
    baroque: ["baroc", "barock", "baroak", "barroque"],
    bass: ["base"],
    basso: ["baso", "bass"],
    bodhran: ["bodrahn", "bodran", "bodhron", "bohran", "bowran", "bowron"],
    cadenza: ["cadensa"],
    canon: ["canan", "cannon"],
    cappella: ["capella", "cappela"],
    castanets: ["castinets"],
    ceilidh: ["caylee", "ceildh", "ceili", "ceilie", "kaylee"],
    cello: ["chello", "chellow", "celo", "cellow"],
    chord: ["chored", "cord"],
    chorale: ["choral", "corale"],
    chromatic: ["chromattic", "chrommatik", "cromatic"],
    clarinet: ["claranet", "clarinett", "clarionet"],
    clarsach: ["carsack"],
    coloratura: ["coleratura", "colorartura", "colourartura", "colouratura"],
    color: ["colour"],
    colour: ["color"],
    concertino: ["conchertino"],
    concerto: ["concherto", "conserto", "concertoe", "concertto"],
    concrete: ["concret", "concreate"],
    continuo: ["continue"],
    crescendo: ["crecendo", "cresendo", "creshendo"],
    crotchet: ["crochet", "crotchett", "crotchit"],
    cymbal: ["cymbol", "simbal", "symbol"],
    cymbals: ["cymbols", "simbals", "symbols"],
    de: ["da", "di"],
    descending: ["desending"],
    diminution: ["diminushion", "diminootion"],
    discord: ["dischord", "discorde", "dissord"],
    distortion: ["distorshon"],
    fiddle: ["fiddol"],
    flute: ["floot"],
    forte: ["fortay", "fortee"],
    fugue: ["fewg", "fuge", "fuguee", "fyoog", "fyoogue"],
    gaelic: ["gaellic", "galic", "gaylic"],
    glissando: ["glisando"],
    harmonic: ["haronimc"],
    harmonics: ["harmonic"],
    glockenspiel: ["glockenshpiel", "glockenspeel", "glockenspeil", "glockensspiel"],
    guitar: ["gittar", "guitarre", "guiter", "gutar"],
    harpsichord: ["harpsichored", "harpsicord", "harpsicorde"],
    hemiola: ["hemeeloa"],
    impressionist: ["impresionist", "impressionest", "impressionisst"],
    improvisation: ["improv"],
    improvised: ["improv"],
    inversion: ["inverssion", "invertion", "inverzion"],
    legato: ["ligato"],
    leitmotiv: ["leitmotif", "leitmotiff", "leitmotivv", "lightmotif"],
    lied: ["lead", "leed", "leet"],
    major: ["majer", "majore", "majour", "mayjor"],
    mezzo: ["metzo", "mezo"],
    metre: ["meter"],
    meter: ["metre"],
    minimalist: ["minimalest", "minamilist", "minimilist"],
    minor: ["miner", "minore", "minur", "mynor"],
    modulation: ["modulashion"],
    musique: ["music", "musike", "muzique"],
    obbligato: ["obligato"],
    oboe: ["obo", "obow"],
    organ: ["orgun"],
    orchestra: ["orcestra", "orchesta"],
    passacaglia: ["pasacaglia", "pasacallia", "passacagliah", "passacalia", "passacallia"],
    percussion: ["percushin", "percushon"],
    phrase: ["frase", "fraze", "phraze"],
    piano: ["peano", "peeano", "pianno"],
    pibroch: ["pibroc", "pibrock"],
    picardie: ["picardi", "picardy", "pickardi", "pickardy"],
    piccolo: ["piccalo", "piccollo", "pickalo", "picollo", "picolo"],
    pizzicato: ["pizicato", "pizzacato", "pizzacatto", "pizzicarto", "pizzicatto", "pitsicato", "pitzicato", "pitsickato"],
    plainchant: ["planechant"],
    rallentando: ["ralentando", "rallentendo", "ralentendo"],
    rapping: ["rap"],
    practice: ["practise"],
    practise: ["practice"],
    psalm: ["psam", "psarm", "salm", "sam"],
    recapitulation: ["recapitualtion", "recapituation", "recapitulashion"],
    recitative: ["recetative", "recitativ", "recititive", "resitative"],
    reggae: ["regae", "rege", "regga", "reggay", "regge", "reggea"],
    reel: ["real"],
    renaissance: ["renaisance", "renaissence", "renasance", "renasans", "renassance", "renissance", "rennaisance"],
    repetition: ["repetion", "repetiton", "repitition", "reppitition"],
    ritardando: ["retardando", "ritardanto", "ritardendo"],
    ritornello: ["returnello"],
    rubato: ["roobato"],
    rhythm: ["rhthm", "rhythym", "rithem", "rithm", "rythem", "rythm"],
    saxophone: ["saxafone", "saxaphon", "saxaphone", "saxofone"],
    sequence: ["seequince"],
    serial: ["searial", "seriel", "seriall"],
    sitar: ["siter"],
    soprano: ["saprano", "soparano", "sopranno", "suprano"],
    sprechgesang: ["shprechgesang", "sprecgisang", "sprechgesaing", "sprechgesgang", "spreckisang", "sprekisang"],
    staccato: ["stacato", "stacatto", "staccatto", "stakkato"],
    strophic: ["strofic", "strofick", "strophik"],
    syllabic: ["silabic"],
    symphony: ["simfony"],
    syncopation: ["sincopation", "syncapation", "syncopashion", "syncopatient"],
    synthesiser: ["synthesizer"],
    synthesizer: ["synthesiser"],
    tenor: ["tenner"],
    tierce: ["tearce", "teerce", "teirce", "tirce"],
    timbre: ["tamber", "timber", "timbur"],
    timpani: ["timpanie", "timpanni", "timpany", "tympani"],
    tonguing: ["tonging", "toungeing", "tounging", "tunging"],
    tremolando: ["tremalando", "tremilando", "tremolo"],
    trombone: ["tromboan", "trombon", "trombonee"],
    trumpet: ["trumpat", "trumpett", "trumpit"],
    tuba: ["chooba"],
    viola: ["veeola"],
    waltz: ["walts"],
    xylophone: ["xilophone", "xylaphone", "xylifone", "xylofone", "zilafone", "zilaphone", "zylaphone", "zylophone"],
  });

  const COMMON_MUSICAL_PHRASE_SPELLINGS = Object.freeze({
    "3 against 2": ["3 against two", "three against 2", "three against two"],
    "a cappella": ["a capella", "a cappela", "acapella", "acappela", "acappella", "cappella"],
    "alberti bass": ["alberty base"],
    antiphonal: ["anti phonal"],
    "bass guitar": ["base guitar", "baseguitar", "bassguitar"],
    "basso continuo": ["baso continuo", "bass continuo", "basso continue"],
    coloratura: ["colour a tura"],
    "ceilidh band": ["caylee band", "ceilidhband", "kaylee band"],
    "con sordino": ["consordino"],
    contrapuntal: ["contra puntal"],
    countermelody: ["counter melody"],
    countertenor: ["counter tenor", "coutner tenor"],
    "double bass": ["double base", "doublebase", "doublebass"],
    "flutter tonguing": ["flutter tongue", "fluttertonging", "fluttertonguing"],
    "gaelic psalm": ["gaelic salm", "gaelic sam", "gaelicpsalm"],
    "hi hat": ["hihat"],
    homophonic: ["homo fonic", "homo phonic"],
    leitmotiv: ["leit motif", "leit motive", "light motif"],
    "mezzo forte": ["mezzoforte"],
    "mezzo piano": ["mezzopiano"],
    "mezzo soprano": ["metzo soparano", "metzo soprano", "mezzo soparano", "mezzosoprano"],
    "musique concrete": ["music concrete", "musiqueconcrete"],
    "neo classical": ["neoclassical"],
    "programme music": ["program music"],
    plainchant: ["plain chant"],
    polyphonic: ["poly fonic", "poly phonic"],
    ragtime: ["rag time"],
    "scat singing": ["scat", "scatting"],
    soul: ["soul music"],
    "through composed": ["throughcomposed", "trew composed"],
    tritone: ["tri tone"],
    "walking bass": ["walkin bass", "walking base", "walkingbass"],
    "waulking song": ["walking song", "waulkin song", "waulkingsong", "wawking song"],
    "whole tone": ["hole tone", "holetone", "wholetone"],
    "whole tone scale": ["hole tone scale", "holetone scale", "wholetone scale"],
  });

  function normalise(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("en-GB")
      .trim()
      .replace(/[‐‑‒–—-]/g, " ")
      .replace(/(\d)·(?=\d)/g, "$1.")
      .replace(/[.,;:!?()[\]{}'’‘\"“”]/g, (character, index, text) =>
        character === "." && /\d/.test(text[index - 1] || "") && /\d/.test(text[index + 1] || "") ? "." : "")
      .replace(/\s*\/\s*/g, "/")
      .replace(/\s+/g, " ");
  }

  function acceptedPhraseSpellings(value, allowCommonSpellings = true) {
    const expected = normalise(value);
    if (!allowCommonSpellings) return [expected];
    return COMMON_PHRASE_LOOKUP.get(expected) || [expected];
  }

  // Compile the fixed alias table once. Rebuilding and normalising every entry
  // for each word in every extended response made whole-paper marking slow.
  const COMMON_PHRASE_LOOKUP = new Map();
  for (const [canonical, alternatives] of Object.entries(COMMON_MUSICAL_PHRASE_SPELLINGS)) {
    const spellings = [...new Set([canonical, ...alternatives].map(normalise))];
    for (const spelling of spellings) if (!COMMON_PHRASE_LOOKUP.has(spelling)) COMMON_PHRASE_LOOKUP.set(spelling, spellings);
  }

  const DISTINCT_MUSICAL_TERMS = new Map([
    ["triple", new Set(["triplet", "triplets"])],
    ["triplet", new Set(["triple"])],
    ["triplets", new Set(["triple"])],
    ["concert", new Set(["concerto"])],
    ["concerto", new Set(["concert"])],
  ]);
  const STRICT_NUMBER_WORDS = new Set(["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"]);

  function isAnswered(subquestion, value) {
    if (subquestion.type === "checkbox") return Array.isArray(value) && value.length > 0;
    if (subquestion.type === "comparison-grid") return Array.isArray(value?.c) && value.c.length > 0;
    if (subquestion.type === "lyric-placement") return Boolean(value && Object.values(value).some(entry => String(entry || "").trim()));
    if (subquestion.type === "structured-review") {
      if (subquestion.finalAnswerField) return Boolean(String(value?.final || "").trim());
      return Boolean(value && Object.values(value).some(entry => String(entry || "").trim()));
    }
    if (subquestion.notationTool === "accidental") {
      const response = normalise(value);
      const match = response.match(/^(flat|natural|sharp)@(\d+)$/);
      const allowedIndices = subquestion.accidentalNoteIndices || [];
      return Boolean(match && (!allowedIndices.length || allowedIndices.includes(Number(match[2]))));
    }
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function responseCount(source, recognisedConceptCount = 0) {
    const entries = String(source || "")
      .split(/\n|[,;•]+/)
      .map(entry => entry.trim())
      .filter(Boolean);
    return Math.max(recognisedConceptCount, entries.length || (String(source || "").trim() ? 1 : 0));
  }

  function markConceptLines(subquestion, value) {
    if (!isAnswered(subquestion, value)) return { marks: 0, status: "unanswered", matchedConcepts: [], matchedEvidence: [], correctEvidence: [], additionalAnswers: 0 };
    const source = String(value || "");
    const matches = (subquestion.conceptBank || []).map(concept => {
      const evidence = (concept.answers || [concept.label]).map(answer => phraseEvidence(source, answer, concept.allowFuzzy !== false, [], concept.allowCommonSpellings !== false)).find(Boolean);
      return evidence ? { concept, evidence } : null;
    }).filter(Boolean);
    const correctMatches = matches.filter(match => match.concept.correct);
    const requiredResponses = Number(subquestion.requiredResponses || subquestion.marks);
    const additionalAnswers = subquestion.additionalAnswerPenalty
      ? Math.max(0, responseCount(source, matches.length) - requiredResponses)
      : 0;
    const marks = Math.max(0, Math.min(subquestion.marks, correctMatches.length) - additionalAnswers);
    const credited = correctMatches.slice(0, marks);
    return {
      marks,
      status: marks === subquestion.marks ? "correct" : marks > 0 ? "partial" : "incorrect",
      matchedConcepts: credited.map(match => match.concept.label),
      matchedEvidence: credited.map(match => ({ label: match.concept.label, ...match.evidence })),
      correctEvidence: correctMatches.map(match => ({ label: match.concept.label, ...match.evidence })),
      recognisedConcepts: matches.map(match => match.concept.label),
      additionalAnswers,
    };
  }

  function markComparisonGrid(subquestion, value) {
    if (!isAnswered(subquestion, value)) return { marks: 0, status: "unanswered", selectedCorrect: [], additionalAnswers: 0 };
    const selected = [...new Set((value?.c || []).map(normalise))];
    const expected = new Set((subquestion.answers || []).map(normalise));
    const selectedCorrect = selected.filter(item => expected.has(item));
    const additionalAnswers = subquestion.additionalAnswerPenalty
      ? Math.max(0, selected.length - Number(subquestion.requiredResponses || subquestion.marks))
      : 0;
    const marks = Math.max(0, Math.min(subquestion.marks, selectedCorrect.length) - additionalAnswers);
    return {
      marks,
      status: marks === subquestion.marks ? "correct" : marks > 0 ? "partial" : "incorrect",
      selectedCorrect,
      additionalAnswers,
    };
  }

  function markLyricPlacement(subquestion, value) {
    if (!isAnswered(subquestion, value)) return { marks: 0, status: "unanswered", matchedConcepts: [], matchedLines: {}, additionalAnswers: 0 };
    const entries = Object.entries(value || {}).filter(([, answer]) => String(answer || "").trim());
    const matchedLines = {};
    const matchedConcepts = [];
    const matchedEntryKeys = new Set();
    for (const concept of subquestion.concepts || []) {
      const acceptedLines = new Set((concept.lines || []).map(String));
      const matches = entries.filter(([line, answer]) => acceptedLines.has(String(line)) && (concept.answers || [concept.label]).some(expected => phraseMatches(normalise(answer), expected, concept.allowFuzzy !== false, concept.allowCommonSpellings !== false)));
      if (!matches.length) continue;
      matchedConcepts.push(concept.id || concept.label);
      matchedLines[concept.id || concept.label] = matches.map(([line]) => String(line));
      matches.forEach(([line]) => matchedEntryKeys.add(String(line)));
    }
    const invalidEntries = entries.filter(([line]) => !matchedEntryKeys.has(String(line))).length;
    const effectiveResponses = matchedConcepts.length + invalidEntries;
    const additionalAnswers = subquestion.additionalAnswerPenalty
      ? Math.max(0, effectiveResponses - Number(subquestion.requiredResponses || subquestion.marks))
      : 0;
    const marks = Math.max(0, Math.min(subquestion.marks, matchedConcepts.length) - additionalAnswers);
    return {
      marks,
      status: marks === subquestion.marks ? "correct" : marks > 0 ? "partial" : "incorrect",
      matchedConcepts: matchedConcepts.slice(0, marks),
      matchedLines,
      additionalAnswers,
    };
  }

  function markObjective(subquestion, value) {
    if (!isAnswered(subquestion, value)) return { marks: 0, status: "unanswered" };
    if (Array.isArray(subquestion.numberedLineAnswers)) {
      const lines = String(value ?? "").split("\n");
      const compact = normalise(value).replace(/\s+/g, "");
      const compactMatch = (subquestion.acceptedCompactAnswers || []).some(answer => normalise(answer).replace(/\s+/g, "") === compact);
      const inline = normalise(String(value).replace(/[,;]+/g, " ")).split(/\s+/);
      const matchesLines = entries => entries.length === subquestion.numberedLineAnswers.length && subquestion.numberedLineAnswers.every((answers, index) => answers.some(answer => answerSpellingMatches(entries[index], answer, subquestion.allowFuzzy !== false, subquestion.allowCommonSpellings !== false)));
      const correct = compactMatch || matchesLines(lines) || (subquestion.allowInlineNumberedAnswers && matchesLines(inline));
      return { marks: correct ? subquestion.marks : 0, status: correct ? "correct" : "incorrect" };
    }
    if (subquestion.type === "checkbox") {
      const expected = (subquestion.answers || []).map(normalise);
      const chosen = [...new Set(value.map(normalise))];
      const correctCount = chosen.filter(item => expected.includes(item)).length;
      const incorrectCount = chosen.filter(item => !expected.includes(item)).length;
      const correct = correctCount === expected.length && incorrectCount === 0;
      return { marks: Math.min(subquestion.marks, correctCount), status: correct ? "correct" : correctCount > 0 ? "partial" : "incorrect", correctCount, incorrectCount };
    }
    const expected = subquestion.acceptedAnswers || [subquestion.answer];
    const caseSensitiveResponse = String(value ?? "").trim();
    const caseSensitiveMatch = (subquestion.caseSensitiveAcceptedAnswers || []).includes(caseSensitiveResponse);
    const caseSensitiveForbidden = (subquestion.caseSensitiveRejectedAnswers || []).includes(caseSensitiveResponse);
    const rawResponse = normalise(value);
    const notationResponse = subquestion.notationTool === "rhythm-entry" && !subquestion.preserveRhythmSequence ? rawResponse.split("|", 1)[0].trim() : rawResponse;
    const response = subquestion.allowMusicSuffix ? notationResponse.replace(/\s+music$/, "").trim() : notationResponse;
    const comparableResponse = subquestion.notationTool === "accidental" ? response.replace(/@\d+$/, "") : response;
    const exactMatch = expected.map(normalise).includes(comparableResponse);
    const spellingMatch = expected.some(answer => answerSpellingMatches(comparableResponse, answer, subquestion.allowFuzzy !== false, subquestion.allowCommonSpellings !== false));
    const phrasedMatch = subquestion.allowAnswerInPhrase && expected.some(answer => phraseMatches(comparableResponse, answer, subquestion.allowFuzzy !== false, subquestion.allowCommonSpellings !== false));
    const keywordMatch = (subquestion.acceptedKeywords || []).some(keyword => phraseMatches(comparableResponse, keyword, subquestion.allowFuzzy !== false, subquestion.allowCommonSpellings !== false));
    const keywordGroupMatch = (subquestion.acceptedKeywordGroups || []).some(group => group.every(keyword => phraseMatches(comparableResponse, keyword, subquestion.allowFuzzy !== false, subquestion.allowCommonSpellings !== false)));
    const exactKeywordGroupMatch = (subquestion.acceptedExactKeywordGroups || []).some(group => group.every(keyword => phraseMatches(comparableResponse, keyword, false)));
    const matchedAcceptedConcepts = (subquestion.acceptedConcepts || []).filter(concept =>
      (concept.answers || []).some(answer => phraseMatches(comparableResponse, answer, concept.allowFuzzy !== false, concept.allowCommonSpellings !== false)),
    );
    const conceptThresholdMatch = matchedAcceptedConcepts.length >= Number(subquestion.minAcceptedConcepts || 1);
    const forbiddenException = (subquestion.forbiddenExceptions || []).some(phrase => phraseMatches(response, phrase, false));
    const forbiddenMatch = !forbiddenException && (subquestion.forbiddenKeywordGroups || []).some(group => group.every(keyword => phraseMatches(response, keyword)));
    const forbiddenExactMatch = !forbiddenException && (subquestion.forbiddenExactKeywordGroups || []).some(group => group.every(keyword => phraseMatches(response, keyword, false)));
    const correct = !caseSensitiveForbidden && !forbiddenMatch && !forbiddenExactMatch && (caseSensitiveMatch || exactMatch || spellingMatch || phrasedMatch || keywordMatch || keywordGroupMatch || exactKeywordGroupMatch || conceptThresholdMatch);
    const result = { marks: correct ? subquestion.marks : 0, status: correct ? "correct" : "incorrect" };
    if (subquestion.acceptedConcepts) result.matchedAcceptedConcepts = matchedAcceptedConcepts.map(concept => concept.id || concept.label);
    return result;
  }

  function editDistance(left, right) {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
      const current = [leftIndex];
      for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
        current[rightIndex] = Math.min(
          current[rightIndex - 1] + 1,
          previous[rightIndex] + 1,
          previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
        );
      }
      previous.splice(0, previous.length, ...current);
    }
    return previous[right.length];
  }

  function tokenMatches(responseToken, expectedToken, allowFuzzy = true, allowCommonSpellings = true) {
    if (responseToken === expectedToken) return true;
    // These are distinct musical meanings, rather than spelling variants.
    // A question can still explicitly list both when its marking scheme does.
    if (DISTINCT_MUSICAL_TERMS.get(expectedToken)?.has(responseToken)) return false;
    if (allowCommonSpellings && (COMMON_MUSICAL_SPELLINGS[expectedToken] || []).includes(responseToken)) return true;
    if (!allowFuzzy) return false;
    if (STRICT_NUMBER_WORDS.has(expectedToken)) return false;
    if (expectedToken.length >= 5 && (responseToken === `${expectedToken}s` || expectedToken === `${responseToken}s`)) return true;
    if (/\d/.test(expectedToken) || expectedToken.length < 6) return false;
    if (editDistance(responseToken, expectedToken) <= 1) return true;
    if (responseToken.length !== expectedToken.length) return false;
    const differences = [];
    for (let index = 0; index < expectedToken.length; index += 1) {
      if (responseToken[index] !== expectedToken[index]) differences.push(index);
    }
    return differences.length === 2
      && differences[1] === differences[0] + 1
      && responseToken[differences[0]] === expectedToken[differences[1]]
      && responseToken[differences[1]] === expectedToken[differences[0]];
  }

  function answerSpellingMatches(response, answer, allowFuzzy = true, allowCommonSpellings = true) {
    const normalisedResponse = normalise(response);
    const expectedSpellings = acceptedPhraseSpellings(answer, allowCommonSpellings);
    if (!normalisedResponse || !expectedSpellings.some(Boolean)) return false;
    if (expectedSpellings.includes(normalisedResponse)) return true;
    return expectedSpellings.some(expected => {
      if (!/^[a-z]+(?: [a-z]+)*$/.test(normalisedResponse) || !/^[a-z]+(?: [a-z]+)*$/.test(expected)) return false;
      const responseTokens = normalisedResponse.match(/[a-z]+/g) || [];
      const expectedTokens = expected.match(/[a-z]+/g) || [];
      return responseTokens.length === expectedTokens.length
        && expectedTokens.length > 0
        && expectedTokens.every((token, index) => tokenMatches(responseTokens[index], token, allowFuzzy, allowCommonSpellings));
    });
  }

  function negatedEvidence(source, start) {
    // Only a directly attached negation is rejected. Do not infer the meaning
    // of an entire paragraph or reject “not only …” descriptions.
    const prefix = String(source).slice(0, start).split(/[.!?;,\n]/).at(-1);
    return /(?:\b(?:no|not|never|without|neither)|\b(?:isn['’]?t|aren['’]?t|doesn['’]?t|don['’]?t|cannot|can['’]?t))(?:\s+(?:a|an|any|the|in|use|using|have|has|heard|hear|play|played|sing|sung|feature|features|sound|sounds|of)){0,4}\s*$/i.test(prefix);
  }

  function phraseMatches(response, phrase, allowFuzzy = true, allowCommonSpellings = true) {
    const normalisedResponse = normalise(response);
    const expectedSpellings = acceptedPhraseSpellings(phrase, allowCommonSpellings);
    if (!normalisedResponse || !expectedSpellings.some(Boolean)) return false;
    for (const expected of expectedSpellings) {
      const padded = ` ${normalisedResponse} `;
      let index = padded.indexOf(` ${expected} `);
      while (index !== -1) {
        if (!negatedEvidence(normalisedResponse, index)) return true;
        index = padded.indexOf(` ${expected} `, index + 1);
      }
    }
    const tokenPositions = [...normalisedResponse.matchAll(/[a-z]+/g)];
    const responseTokens = tokenPositions.map(match => match[0]);
    for (const expected of expectedSpellings) {
      if (/\d|\//.test(expected)) continue;
      const expectedTokens = expected.match(/[a-z]+/g) || [];
      if (!expectedTokens.length || responseTokens.length < expectedTokens.length) continue;
      for (let index = 0; index <= responseTokens.length - expectedTokens.length; index += 1) {
        const matches = expectedTokens.every((token, tokenIndex) => tokenMatches(responseTokens[index + tokenIndex], token, allowFuzzy, allowCommonSpellings));
        const harmonicMinorConflict = normalise(phrase) === "harmonics"
          && responseTokens[index] === "harmonic"
          && responseTokens[index + 1] === "minor";
        if (matches && !harmonicMinorConflict && !negatedEvidence(normalisedResponse, tokenPositions[index].index)) return true;
      }
    }
    return false;
  }

  function phraseEvidence(source, phrase, allowFuzzy = true, excludedRanges = [], allowCommonSpellings = true) {
    const responseTokens = [];
    const tokenPattern = /[a-zÀ-ÖØ-öø-ÿ]+|\d+(?:\s*\/\s*\d+)?|[<>＜＞]/gi;
    for (const match of String(source || "").matchAll(tokenPattern)) {
      responseTokens.push({ value: normalise(match[0]), start: match.index, end: match.index + match[0].length });
    }
    for (const expectedSpelling of acceptedPhraseSpellings(phrase, allowCommonSpellings)) {
      const expectedTokens = expectedSpelling.match(/[a-z]+|\d+(?:\/\d+)?|[<>＜＞]/g) || [];
      if (!expectedTokens.length || responseTokens.length < expectedTokens.length) continue;
      for (let index = 0; index <= responseTokens.length - expectedTokens.length; index += 1) {
        const window = responseTokens.slice(index, index + expectedTokens.length);
        const matches = expectedTokens.every((expected, tokenIndex) => {
          const actual = window[tokenIndex].value;
          if (actual === expected) return true;
          if (/\d|\/|[<>＜＞]/.test(expected)) return false;
          return tokenMatches(actual, expected, allowFuzzy, allowCommonSpellings);
        });
        const harmonicMinorConflict = normalise(phrase) === "harmonics"
          && window[0]?.value === "harmonic"
          && responseTokens[index + 1]?.value === "minor";
        if (matches && !harmonicMinorConflict) {
          const start = window[0].start;
          const end = window.at(-1).end;
          if (negatedEvidence(source, start) || excludedRanges.some(range => range && start >= range.start && end <= range.end)) continue;
          return { start, end, text: String(source || "").slice(start, end) };
        }
      }
    }
    return null;
  }

  function markStructuredResponse(subquestion, value) {
    if (!isAnswered(subquestion, value)) return { marks: 0, status: "unanswered", matchedConcepts: {}, matchedEvidence: {}, validConceptCounts: {} };
    const source = String(value?.final || "");
    const matchedConcepts = {};
    const matchedEvidence = {};
    const validConceptCounts = {};
    const creditedConceptIds = new Set();
    let marks = 0;
    for (const heading of subquestion.headings || []) {
      const concepts = heading.concepts || (heading.markingPoints || []).map(point => ({ label: point, answers: [point] }));
      const matches = concepts.map(concept => {
        const fallbackExcluded = (concept.fallbackExcludedBy || []).some(answer => phraseEvidence(source, answer, concept.allowFuzzy !== false));
        const answers = [...(concept.answers || [concept.label]), ...(!fallbackExcluded ? concept.fallbackAnswers || [] : [])];
        const allowCommonSpellings = concept.allowCommonSpellings !== false;
        const excludedRanges = [...(concept.excludeWithinAnswers || []), ...(concept.blockedAnswers || [])].map(answer => phraseEvidence(source, answer, false, [], allowCommonSpellings)).filter(Boolean);
        const alwaysBlockedRanges = (concept.alwaysBlockedAnswers || []).map(answer => phraseEvidence(source, answer, false, [], allowCommonSpellings)).filter(Boolean);
        const exactEvidence = answers.map(answer => phraseEvidence(source, answer, false, [...excludedRanges, ...alwaysBlockedRanges], allowCommonSpellings)).find(Boolean);
        const alwaysBlocked = !exactEvidence && alwaysBlockedRanges.length > 0;
        const blocked = !exactEvidence && (alwaysBlocked || (concept.blockedAnswers || []).some(answer => phraseEvidence(source, answer, false, [], allowCommonSpellings)));
        const requiresGroups = concept.allTermGroups || concept.distinctTermGroups;
        const groupedEvidence = requiresGroups ? advancedEvidence(source, concept) : null;
        const evidence = requiresGroups ? groupedEvidence : exactEvidence || (!blocked ? answers.map(answer => phraseEvidence(source, answer, concept.allowFuzzy !== false, excludedRanges, allowCommonSpellings)).find(Boolean) : null);
        return evidence ? { concept, evidence } : null;
      }).filter(Boolean);
      const eligible = matches.filter(match => !match.concept.creditId || !creditedConceptIds.has(match.concept.creditId));
      const remainingMarks = Math.max(0, subquestion.marks - marks);
      const conceptsPerMark = Number(subquestion.conceptsPerMark || 1);
      const headingMarks = Math.min(Math.floor(eligible.length / conceptsPerMark), subquestion.maxMarksPerHeading || 2, remainingMarks);
      const banked = eligible.slice(0, headingMarks * conceptsPerMark);
      banked.forEach(match => {
        if (match.concept.creditId) creditedConceptIds.add(match.concept.creditId);
      });
      matchedConcepts[heading.id] = banked.map(match => match.concept.label);
      matchedEvidence[heading.id] = banked.map(match => ({ label: match.concept.label, ...match.evidence }));
      validConceptCounts[heading.id] = matches.length;
      marks += headingMarks;
    }
    // Structured final answers award valid concepts up to the heading and paper
    // caps. Extra or incorrect entries are ignored and do not reduce the mark.
    const headingsCovered = Object.values(matchedConcepts).filter(items => items.length > 0).length;
    if (subquestion.minHeadingsForFullMarks && marks === subquestion.marks && headingsCovered < subquestion.minHeadingsForFullMarks) {
      marks = Math.max(0, subquestion.marks - 1);
    }
    return { marks, status: marks === subquestion.marks ? "correct" : marks > 0 ? "partial" : "incorrect", matchedConcepts, matchedEvidence, validConceptCounts, headingsCovered, additionalAnswers: 0 };
  }

  function suggestedReview(subquestion, value) {
    const byHeading = {};
    let suggestedCount = 0;
    for (const heading of subquestion.headings || []) {
      const response = normalise(subquestion.finalAnswerField ? value?.final : value?.[heading.id]);
      const matches = heading.markingPoints.filter(point => {
        const target = normalise(point);
        return response && (response.includes(target) || target.includes(response));
      });
      byHeading[heading.id] = [...new Set(matches)];
      suggestedCount += Math.min(2, byHeading[heading.id].length);
    }
    return { marks: 0, status: "review", reviewRequired: true, suggestedMarks: Math.min(subquestion.marks, suggestedCount), suggestedMatches: byHeading };
  }

  function advancedEvidence(source, concept) {
    const exclusions=[...(concept.excludeWithinAnswers||[]),...(concept.blockedAnswers||[]),...(concept.alwaysBlockedAnswers||[])].map(text=>phraseEvidence(source,text,false)).filter(Boolean);
    if (concept.distinctTermGroups) {
      const matches = concept.distinctTermGroups.map(group => group.map(word => phraseEvidence(source, word, false, exclusions)).find(Boolean)).filter(Boolean);
      if (matches.length >= Number(concept.minDistinctTermGroups || 2)) {
        const start = Math.min(...matches.map(match => match.start)), end = Math.max(...matches.map(match => match.end));
        return { start, end, text: source.slice(start, end) };
      }
      return (concept.answers || []).map(answer => phraseEvidence(source, answer, concept.allowFuzzy !== false, exclusions)).find(Boolean) || null;
    }
    if (concept.allTermGroups) {
      const matches = [];
      for (const group of concept.allTermGroups) {
        matches.push(group.map(word => phraseEvidence(source, word, false, [...exclusions, ...matches.filter(Boolean)])).find(Boolean));
      }
      if (matches.every(Boolean)) { const start=Math.min(...matches.map(match=>match.start)),end=Math.max(...matches.map(match=>match.end));return {start,end,text:source.slice(start,end)}; }
      return (concept.answers || []).map(answer => phraseEvidence(source, answer, concept.allowFuzzy !== false, exclusions)).find(Boolean) || null;
    }
    const evidence=(concept.answers||[concept.label]).map(text=>phraseEvidence(source,text,concept.allowFuzzy!==false,exclusions,concept.allowCommonSpellings!==false)).find(Boolean);
    if(!evidence)return null;
    return evidence;
  }
  function advancedExcerptText(source, index) {
    const reference=/(?:excerpt\s*([12])|excerpt\s*(one|two)|the\s+(first|second)\s+(?:excerpt|piece)|(?:piece|extract)\s*([12]))/gi;
    const matches=[...source.matchAll(reference)];
    if (!matches.length) {
      const paragraphs = source.split(/\n+/).filter(text => text.trim());
      return paragraphs.length >= 2 ? paragraphs[index - 1] || '' : '';
    }
    return matches.filter(match=>Number(match[1]||match[4]||(['one','first'].includes(match[2]||match[3])?1:2))===index)
      .map(match=>source.slice(/\bonly\s*$/i.test(source.slice(Math.max(0,match.index-6),match.index)) ? Math.max(0,match.index-5) : match.index,(matches.find(next=>next.index>match.index)?.index??source.length))).join('\n');
  }
  // The rubric distinguishes a written description from a list, not a number
  // of words. Short complete clauses such as “Both are major” are descriptions.
  function comparisonDescription(source) {
    return /\b(?:both|each|excerpts?|pieces?|extracts?|music|first|second|it|they)\b[^.!?;:\n]*\b(?:is|are|was|were|has|have|uses?|features?|contains?|includes?|employs?|sounds?|plays?|changes?|modulates?|remains?|starts?|begins?|ends?)\b/i.test(source);
  }
  function exclusiveExcerpt(source) { return /\bonly\s+(?:in\s+)?(?:excerpt|piece|extract)\s*(?:[12]|one|two)\b|\b(?:excerpt|piece|extract)\s*(?:[12]|one|two)\s+only\b/i.test(source); }
  function comparisonSentences(source) { return source.split(/(?<=[.!?;])\s+|\n/).filter(text=>text.trim()); }
  function negatedAdvancedEvidence(source, concept) {
    // Keep positive and explicitly denied instances separate: a later denial
    // must not leave an earlier contradictory assertion credited.
    const affirmative=source.replace(/\b(?:isn['’]?t|aren['’]?t|wasn['’]?t|weren['’]?t|doesn['’]?t|don['’]?t|hasn['’]?t|haven['’]?t|cannot|can['’]?t)\b/gi,' not ');
    return comparisonSentences(affirmative).some(sentence=>{
      const denied=sentence.match(/\b(?:no|not|never|without|neither)\b(?!\s+only\b)([^.!?;:\n]*)/i);
      return denied&&advancedEvidence(denied[1].split(/\b(?:but|however|whereas|instead)\b/i)[0],concept);
    });
  }
  function advancedContradiction(source,concept) {
    return negatedAdvancedEvidence(source,concept);
  }
  function finalAnswerText(value) { return typeof value==='string'?value:String(value?.final||''); }
  // Keep positive claims separate from denials, while retaining legitimate
  // negative evidence such as “without vibrato” or “no clear phrase structure”.
  // These rules apply only to the source-audited AH conclusion inventories.
  function conclusionEvidence(source, concept) {
    const aliases = [...(concept.answers || []), ...(concept.allTermGroups || []).flat()];
    const text = source.replace(/\b(?:isn['’]?t|aren['’]?t|wasn['’]?t|weren['’]?t|doesn['’]?t|don['’]?t|hasn['’]?t|haven['’]?t|cannot|can['’]?t)\b/gi, ' not ');
    let contradicted = false;
    const affirmative = text.replace(/\b(?:no|not|never|without|neither)\b(?!\s+(?:only|just)\b)[^.!?;:\n]*/gi, denied => {
      const clause = denied.split(/\b(?:but|however|whereas|instead)\b/i)[0];
      const explicitNegative = aliases.some(answer => /^(?:no|not|without|never)\b/i.test(answer) && phraseEvidence(clause, answer, false)?.start === 0);
      if (explicitNegative) return denied;
      if (aliases.some(answer => phraseEvidence(clause.replace(/^\w+\s*/, ''), answer, false))) contradicted = true;
      return ' '.repeat(clause.length) + denied.slice(clause.length);
    });
    return !contradicted && advancedEvidence(affirmative, concept);
  }
  function conclusionExcerptText(source, index) {
    const expanded = source.replace(/\b(?:the\s+)?(first|second)\s+(?:one|extract)\b/gi, (_, ordinal) => `Excerpt ${ordinal.toLowerCase() === 'first' ? 1 : 2}`)
      .replace(/(^|\n|;\s*)([12])\s*[).:]\s*/g, '$1Excerpt $2: ');
    return advancedExcerptText(expanded, index);
  }
  function sharedConclusionText(source) {
    // “Both singers” inside one excerpt's explanation is not a statement
    // about both excerpts. Only an independently shared claim supplies both.
    return comparisonSentences(source).filter(sentence => /^\s*(?:both(?:\s+(?:excerpts|pieces|extracts))?|each\s+(?:excerpt|piece|extract)|(?:the\s+)?two\s+(?:excerpts|pieces|extracts))\s+(?:are|have|use|feature|contain|include|employ|sound|is|has|uses|features|contains|includes)\b/i.test(sentence)).join('\n');
  }
  function markAdvancedResponse(part,value,answers={}) {
    if(!isAnswered(part,value))return {marks:0,status:'unanswered',matchedConcepts:{},matchedEvidence:{}};
    const source=String(value?.final||value||'');
    const evidence=[],labels=[];
    let marks=0, conclusionDetails;
    if(part.markingProfile==='chord-inversions') {
      const fields=source.split('|').map(normalise);
      const chord=(text,accepted)=>accepted.some(answer=>normalise(answer)===text);
      const inversion=text=>/^(?:1|1st|first|1st inv|1st inversion|first inv|first inversion|b)$/.test(text);
      const first=fields.length===4&&(chord(fields[0],['F/A','Fmaj/A','Ib','1b'])||chord(fields[0],['F','F major','Fmaj','I','1'])&&inversion(fields[1]));
      const second=fields.length===4&&(chord(fields[2],['Gm/Bb','IIb','2b'])||chord(fields[2],['Gm','G minor','II','2'])&&inversion(fields[3]));
      marks=first&&second?1:0;
      // Also accept the complete written response when imported or entered as a single line.
      if((part.acceptedAnswers||[]).some(answer=>normalise(answer)===normalise(source)))marks=1;
    } else if(part.markingProfile==='advanced-comparison') {
      const sentences=comparisonSentences(source);
      const first=advancedExcerptText(source,1),second=advancedExcerptText(source,2);
      for(const concept of part.similarities||[]) {
        const shared=sentences.filter(sentence=>!/\bonly\b/i.test(sentence)&&(/\b(?:both|each|similar|common|two excerpts|two pieces)\b/i.test(sentence)||!/(?:excerpt|piece|extract)\s*(?:1|2|one|two)|(?:first|second)\s+(?:excerpt|piece|extract)/i.test(sentence))).join('\n');
        let valid=advancedEvidence(shared,concept)||(advancedEvidence(first,concept)&&advancedEvidence(second,concept));
        if(concept.sameAlternatives) valid=concept.sameAlternatives.some(alternatives=>{
          const variant=Array.isArray(alternatives)?{answers:alternatives}:alternatives;
          return advancedEvidence(shared,variant)||(advancedEvidence(first,variant)&&advancedEvidence(second,variant));
        });
        const exclusive=sentences.some(sentence=>exclusiveExcerpt(sentence)&&advancedEvidence(sentence,concept));
        if(valid&&!exclusive&&!advancedContradiction(source,concept)){
          labels.push(concept.label);const item=advancedEvidence(source,concept);if(item)evidence.push({label:concept.label,...item});
        }
      }
      for(const difference of part.differences||[]) {
        const firstConcept=difference.firstConcept||{answers:difference.first||[],allowFuzzy:false,excludeWithinAnswers:difference.blockedFirst};
        const secondConcept=difference.secondConcept||{answers:difference.second||[],allowFuzzy:false,excludeWithinAnswers:difference.blockedSecond};
        const firstMatch=advancedEvidence(first,firstConcept),secondMatch=advancedEvidence(second,secondConcept);
        const a=Boolean(firstMatch)&&!advancedContradiction(first,firstConcept)&&!(difference.invalidFirst||[]).some(answer=>advancedEvidence(first,{answers:[answer],allowFuzzy:false}));
        const b=Boolean(secondMatch)&&!advancedContradiction(second,secondConcept)&&!(difference.invalidSecond||[]).some(answer=>advancedEvidence(second,{answers:[answer],allowFuzzy:false}));
        let valid=a&&b;
        if(difference.only){
          const own=difference.only===1?first:second,other=difference.only===1?second:first;
          const concept=difference.only===1?firstConcept:secondConcept;
          const explicitContrast=exclusiveExcerpt(own)||negatedAdvancedEvidence(other,concept)||/\b(?:unlike|absent from|not in|not present in)\b/i.test(own);
          const shared=sentences.some(sentence=>/\b(?:both|each)\b/i.test(sentence)&&advancedEvidence(sentence,concept));
          valid=Boolean(difference.only===1?a:b)&&explicitContrast&&!advancedEvidence(other,concept)&&!shared;
        }
        if(valid){labels.push(difference.label);const item=firstMatch||secondMatch;if(item)evidence.push({label:difference.label,...item});}
      }
      const count=labels.length;
      marks=count>=6?4:count>=4?3:count>=2?2:count?1:0;
      if(!comparisonDescription(source))marks=Math.min(2,marks);
    } else if(part.markingProfile==='advanced-conclusion') {
      const identified=[],justified=[];
      conclusionDetails=[];
      (part.styles||[]).forEach((style,index)=>{
        const shared=sharedConclusionText(source);
        const text=[conclusionExcerptText(source,index+1),shared].filter(Boolean).join('\n');
        const blocked=(style.blocked||[]).some(answer=>advancedEvidence(text,{answers:[answer],allowFuzzy:false}));
        const acceptedStyles=(style.answers||[]).map(normalise);
        const extraStyles=[...new Set([...(style.wrongStyles||[]),'renaissance','baroque','classical','romantic','impressionist','impressionism','minimalist','serial','atonal','modern','20th century','twentieth century','21st century','twenty first century','popular','jazz','contemporary','neo classical','neoclassical'])]
          .filter(answer=>!acceptedStyles.includes(normalise(answer)));
        // An accepted compound label (eg Neo-classical, or an arrangement of a
        // Baroque piece) must not be rejected for the period word inside it.
        const acceptedRanges=style.answers.map(answer=>advancedEvidence(text,{answers:[answer],allowFuzzy:false})).filter(Boolean);
        const identification=text.replace(/\b(?:classical|baroque|romantic|jazz)\s+harmony\b/gi,match=>' '.repeat(match.length));
        const classicalIsWrong=index===1&&!acceptedStyles.includes('classical')&&advancedEvidence(text.replace(/\bneo[- ]classical\b|\bneoclassical\b/gi,''),{answers:['classical'],allowFuzzy:false});
        const wrong=extraStyles.some(answer=>phraseEvidence(identification,answer,false,acceptedRanges)) || classicalIsWrong;
        const valid=!blocked&&!wrong&&style.answers.some(answer=>conclusionEvidence(text,{answers:[answer],allowFuzzy:false}));
        identified[index]=valid;
        // Teacher requirement: the justification must be stated in this
        // conclusion. Earlier final answers and rough work cannot supply it.
        const support=text;
        const reasonConcepts=[...(style.reasons||[]).map(answer=>({label:answer,answers:[answer]})),...(style.reasonConcepts||[])];
        const reasons=reasonConcepts.filter(concept=>conclusionEvidence(support,concept));
        justified[index]=Boolean(valid&&reasons.length);
        conclusionDetails.push({excerpt:index+1,identified:Boolean(valid),justified:justified[index],reasons:valid?reasons.map(concept=>concept.label):[]});
        if(valid){labels.push(part.headings?.[0]?.concepts?.[index]?.label || `Excerpt ${index+1}: correct style/period`);const item=style.answers.map(answer=>advancedEvidence(source,{answers:[answer],allowFuzzy:false})).find(Boolean);if(item)evidence.push({label:labels.at(-1),...item});}
      });
      marks=justified.every(Boolean)&&identified.every(Boolean)?2:identified.every(Boolean)||justified.some(Boolean)?1:0;
    }
    return {marks,status:marks===part.marks?'correct':marks?'partial':'incorrect',validConceptCounts:{[part.headings?.[0]?.id || part.markingProfile]:labels.length},matchedConcepts:{[part.headings?.[0]?.id || part.markingProfile]:labels},matchedEvidence:{[part.headings?.[0]?.id || part.markingProfile]:evidence},...(conclusionDetails?{conclusionDetails}:{}),additionalAnswers:0};
  }

  function markSubquestion(subquestion, value, answers = {}) {
    if (subquestion.markingProfile) return markAdvancedResponse(subquestion, value, answers);
    if (subquestion.type === "concept-lines") return markConceptLines(subquestion, value);
    if (subquestion.type === "comparison-grid") return markComparisonGrid(subquestion, value || {});
    if (subquestion.type === "lyric-placement") return markLyricPlacement(subquestion, value || {});
    if (subquestion.type === "structured-review" && subquestion.autoMark) return markStructuredResponse(subquestion, value || {});
    if (subquestion.type === "structured-review") return suggestedReview(subquestion, value || {});
    return markObjective(subquestion, value);
  }

  function markPaper(paper, answers) {
    let score = 0;
    let reviewMarks = 0;
    const questionBreakdown = paper.questions.map(question => {
      const parts = question.subquestions.map(subquestion => {
        const result = markSubquestion(subquestion, answers[subquestion.id], answers);
        score += result.marks;
        if (result.reviewRequired) reviewMarks += subquestion.marks;
        return { id: subquestion.id, label: subquestion.label, maxMarks: subquestion.marks, value: answers[subquestion.id], ...result };
      });
      return { id: question.id, number: question.number, topic: question.topic, marks: parts.reduce((sum, part) => sum + part.marks, 0), maxMarks: question.marks, reviewRequired: parts.some(part => part.reviewRequired), parts };
    });
    const topicMap = {};
    questionBreakdown.forEach(item => {
      topicMap[item.topic] ||= { topic: item.topic, marks: 0, maxMarks: 0, reviewRequired: false };
      topicMap[item.topic].marks += item.marks;
      topicMap[item.topic].maxMarks += item.maxMarks;
      topicMap[item.topic].reviewRequired ||= item.reviewRequired;
    });
    return {
      score,
      totalMarks: paper.totalMarks,
      automaticallyMarkableMarks: paper.totalMarks - reviewMarks,
      reviewMarks,
      percentage: Math.round((score / paper.totalMarks) * 100),
      questionBreakdown,
      topicBreakdown: Object.values(topicMap),
    };
  }

  const api = { normalise, isAnswered, responseCount, markSubquestion, markPaper };
  root.ExamMarking = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
