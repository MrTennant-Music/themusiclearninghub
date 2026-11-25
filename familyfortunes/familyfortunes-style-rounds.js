/* Round answers adapted from the Music Dictionary's Styles entries, keyed by concept ID. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.FamilyFortunesStyles = factory();
})(typeof window === "undefined" ? globalThis : window, function () {
  const answersByConcept = {
    "MC-0001": [["12-bar blues", "12-bar chord pattern"], "Blues scale", "Bent notes", "Call and response"],
    "MC-0002": [["Improvised solos", "Improvisation"], "Swung rhythms", "Syncopation", "Saxophone"],
    "MC-0003": [["Syncopation", "Off-beat rhythms"], "Strong dance pulse", "Bongos", "Claves"],
    "MC-0004": ["Spoken dialogue", "Songs develop the story", ["Dance", "Choreography"], ["Band or orchestra", "Band", "Orchestra"]],
    "MC-0005": ["Catchy hooks", "Verse and chorus", ["Steady drum beat", "Regular beat"], "Lead vocals"],
    "MC-0006": ["Electric guitar", "Driving beat", "Guitar riffs", "Distortion"],
    "MC-0007": ["Strong backbeat", "Walking bass", ["12-bar blues", "12-bar chord pattern"], "Repeated riffs"],
    "MC-0008": ["Fiddle", "Bagpipes", ["Scottish dance rhythms", "Reel", "Jig", "Strathspey"], ["Scots or Gaelic lyrics", "Scots lyrics", "Gaelic lyrics"]],
    "MC-0069": [["Layered percussion", "Layered drums"], ["Interlocking rhythms", "Overlapping rhythms"], "Call and response", "Repeated rhythmic patterns"],
    "MC-0070": ["Basso continuo", ["Contrapuntal texture", "Counterpoint", "Polyphony"], "Harpsichord", ["Ornaments", "Ornamentation"]],
    "MC-0071": [["Solo instrument", "Soloist"], "Orchestra", "Cadenza", ["Several movements", "Contrasting movements", "Three movements"]],
    "MC-0072": [["Gaelic syllables", "Gaelic words"], ["Unaccompanied singing", "A cappella"], ["Dance rhythm", "Music for dancing"], "Nonsense syllables"],
    "MC-0073": ["Story is sung", ["Chorus", "Choir"], "Orchestra", "Solo singers"],
    "MC-0074": ["Piano", "Syncopated melody", ["Alternating bass notes and chords", "Bass note then chord", "Vamp"], "Steady accompaniment"],
    "MC-0075": [["Spoken delivery", "Speaking"], ["Rhyming words", "Rhyme"], ["Words in time with the beat", "Rhythmic speech"], "Repeated backing groove"],
    "MC-0076": ["Jamaica", "Off-beat chords", "Prominent bass line", "Relaxed groove"],
    "MC-0077": ["Expressive melodies", "Rubato", "Chromatic harmony", "Expanded orchestra"],
    "MC-0078": [["Sung in Scots", "Scots words"], ["Tells a story", "Narrative song"], ["Strophic", "Same tune for every verse"], ["Sparse accompaniment or none", "Unaccompanied", "Simple accompaniment"]],
    "MC-0079": [["Swung rhythms", "Long-short pairs"], "Big band", "Repeated riffs", "Call and response"],
    "MC-0144": [["Solo singer", "Operatic solo"], "Orchestral accompaniment", ["Lyrical melody", "Memorable tune"], ["Expresses the character's feelings", "Expresses emotions"]],
    "MC-0145": [["Sung in Scots", "Scots dialect"], ["Story about rural life", "Farm work"], "Unaccompanied singing", ["Strophic", "Same tune for each verse"]],
    "MC-0146": ["Celtic folk melodies", "Fiddle", "Electric guitar", "Drum kit"],
    "MC-0147": [["Large group of singers", "Choir"], ["Several voice parts", "Sings in parts"], "Orchestral accompaniment", "Comments on the action"],
    "MC-0148": ["Balanced phrases", ["Homophony", "Melody and accompaniment"], "Clear melody", "Alberti bass"],
    "MC-0149": ["Scottish Gaelic", "Unaccompanied singing", ["Precentor leads each line", "Leader starts each line"], "Overlapping voices"],
    "MC-0150": ["Christian religious words", "Expressive lead singing", "Call and response", "Hand-clapping"],
    "MC-0151": ["Sitar", "Tabla", "Drone", "Improvised melody"],
    "MC-0152": [["Short repeated patterns", "Loops", "Ostinatos"], "Gradual change", "Phasing", ["Adding notes", "Additive process"]],
    "MC-0153": ["Solo Highland bagpipes", "Continuous drones", "Theme and variations", ["Grace notes", "Ornamentation"]],
    "MC-0154": ["Full orchestra", "Contrasting movements", "Sonata form in the first movement", ["Minuet and trio", "Minuet"]],
    "MC-0155": ["Scottish Gaelic", "Steady pulse", "Call and response", "Unaccompanied singing"],
    "MC-0214": ["Small ensemble", "One player per part", "No conductor", ["Independent parts", "Interacting parts"]],
    "MC-0215": ["Whole-tone scale", "Parallel chords", "Unresolved harmony", "Delicate orchestration"],
    "MC-0216": ["Syncopated funk groove", "Jazz improvisation", ["Repeated bass riffs", "Bass ostinato"], "Electric piano"],
    "MC-0217": ["German text", "Solo voice", "Piano accompaniment", ["Piano illustrates the words", "Piano reflects the mood"]],
    "MC-0218": ["Latin text", ["Fixed sections of the Mass", "Kyrie", "Gloria", "Credo", "Sanctus", "Benedictus", "Agnus Dei"], ["Choir", "Chorus"], ["Roman Catholic worship", "Catholic liturgy"]],
    "MC-0219": [["Recorded everyday sounds", "Real-world recordings"], ["Looping", "Repeated samples"], ["Reversed sounds", "Backwards sounds"], "Changing playback speed"],
    "MC-0220": ["Sacred or biblical story", ["Soloists and choir", "Soloists", "Choir"], "Orchestra", ["Concert performance without staging", "No acting", "No scenery"]],
    "MC-0221": [["Monophonic texture", "Single melody", "Unison"], "Latin words", ["Unaccompanied singing", "A cappella"], ["Free rhythm", "No regular metre", "Rhythm follows the words"]],
    "MC-0222": [["Speech-like singing", "Heightened speech"], ["Free rhythm", "Rhythm follows the words"], "Sparse accompaniment", ["Moves the story forward", "Delivers dialogue"]],
    "MC-0223": [["Solo instrument or instrument with piano", "Solo instrument", "Instrument with piano"], "Contrasting movements", "Sonata form in the first movement", "No orchestra"],
    "MC-0224": ["Gospel influence", "Expressive lead vocals", "Call and response", ["Horn section", "Brass"]],
    "MC-0225": ["Two violins", "Viola", "Cello", ["Independent parts", "Parts exchange the tune"]],
    "MC-0262": ["English text", ["Sacred words", "Religious text"], "Choir", "Contrasting solo and choral passages"],
    "MC-0263": ["Solo voice", "Lute accompaniment", ["Simple tune", "Tuneful melody"], ["Reflective character", "Melancholy"]],
    "MC-0264": ["Fa-la-la refrain", "Light dance character", ["Strophic", "Melody repeats by verse"], "Several voices"],
    "MC-0265": [["German Lutheran hymn tune", "Lutheran hymn"], ["SATB", "Four voice parts"], ["Homophonic texture", "Chordal writing"], "Regular rhythm"],
    "MC-0266": ["Improvisation", "Chromatic harmony", ["Changing metres", "Changing time signatures"], "Cross-rhythms"],
    "MC-0267": ["Programmed drums", "Synthesisers", "Loops", "Drops"],
    "MC-0268": ["Renaissance court dance", "Fast tempo", ["Triple metre", "Three beats per bar"], "Hemiola"],
    "MC-0269": [["Secular text", "Non-religious words"], ["A cappella", "Unaccompanied singing"], "Imitation", "Word painting"],
    "MC-0270": ["Latin text", "Polyphonic choral writing", "Imitation", "Text outside the Mass Ordinary"],
    "MC-0271": ["Traditional melodies", "Folk dances", "Traditional instruments", "National stories or history"],
    "MC-0272": ["Balanced phrases", "Classical forms", ["Modern dissonance", "Dissonance"], "Small ensembles"],
    "MC-0273": ["Renaissance court dance", ["Slow tempo", "Stately pace"], ["Duple metre", "Two beats per bar"], ["Lute, keyboard or consort", "Lute", "Keyboard", "Consort"]],
    "MC-0274": [["Modal harmony", "Modes"], "Polyphony", "Imitation", ["Unaccompanied choral music", "A cappella"]],
    "MC-0275": [["Twelve-tone row", "Tone row", "Note row"], "Transposition", "Inversion", "Retrograde"],
  };

  const topics = {
    "MC-0003": "Latin American music", "MC-0004": "a musical", "MC-0008": "Scottish music",
    "MC-0070": "Baroque music", "MC-0071": "a concerto", "MC-0077": "Romantic music",
    "MC-0144": "an aria", "MC-0145": "a bothy ballad", "MC-0147": "a chorus in an opera or oratorio",
    "MC-0148": "Classical-period music", "MC-0151": "Indian music", "MC-0152": "Minimalist music",
    "MC-0154": "a symphony", "MC-0155": "a waulking song", "MC-0215": "Impressionist music",
    "MC-0217": "a Lied", "MC-0218": "a musical setting of the Mass", "MC-0220": "an oratorio",
    "MC-0222": "recitative", "MC-0223": "a sonata", "MC-0225": "a string quartet",
    "MC-0262": "an anthem", "MC-0263": "a Renaissance ayre", "MC-0264": "a ballett",
    "MC-0265": "a chorale", "MC-0268": "a galliard", "MC-0269": "a madrigal", "MC-0270": "a Renaissance motet",
    "MC-0271": "Nationalist music", "MC-0272": "Neoclassical music", "MC-0273": "a pavan",
    "MC-0274": "Renaissance music", "MC-0275": "Serial music",
  };

  function rounds(dictionary, level) {
    return dictionary.concepts.flatMap((concept) => {
      if (concept.level !== level || !concept.categories.includes("Styles")) return [];
      const entries = answersByConcept[concept.id];
      if (!entries) return [];
      const variants = entries.map((entry) => Array.isArray(entry) ? entry : [entry]);
      return [{
        id: concept.id,
        label: concept.name,
        prompt: `Name four features or facts about ${topics[concept.id] || concept.name}.`,
        answers: variants.map(([answer]) => answer),
        answerAliases: Object.fromEntries(variants.map(([answer, ...aliases]) => [answer, aliases])),
      }];
    });
  }

  return { rounds };
});
