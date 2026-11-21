(() => {
  "use strict";

  const legacyColumns = [
    "Session", "Running Order", "Pupil Name", "Level", "Teaching Class", "Teacher",
    "Assessor", "Instrument 1", "Pieces 1", "Instrument 2", "Pieces 2"
  ];
  const pieceColumns = Array.from({ length: 8 }, (_, index) => `Piece ${index + 1}`);
  const columns = ["Date", "Order", "Full Name", "Level", "Teacher", "Assessor",
    "Instrument 1", ...pieceColumns, "Instrument 2", ...pieceColumns];
  const levels = ["National 5", "Higher", "Advanced Higher"];
  const elements = (node, name) => Array.from(node.getElementsByTagNameNS("*", name));
  const text = (node, name) => elements(node, name).map(element => element.textContent).join("");
  const key = value => value.trim().replace(/\s+/g, " ").toLowerCase();

  async function read(buffer, zipLibrary) {
    if (!zipLibrary) throw new Error("The workbook reader could not be loaded. Refresh and try again.");
    const zip = await zipLibrary.loadAsync(buffer).catch(() => {
      throw new Error("The workbook could not be read. Save a fresh .xlsx copy and try again.");
    });
    async function xml(path) {
      const file = zip.file(path);
      if (!file) throw new Error("Use the Digital Performance Assessment roster template.");
      const document = new DOMParser().parseFromString(await file.async("string"), "application/xml");
      if (elements(document, "parsererror").length) throw new Error("The workbook could not be read. Save a fresh .xlsx copy and try again.");
      return document;
    }
    const workbook = await xml("xl/workbook.xml");
    const sheets = elements(workbook, "sheet");
    const sheet = sheets.find(element => element.getAttribute("name") === "Roster")
      || sheets.find(element => element.getAttribute("name") === "Prelim Roster");
    if (!sheet) throw new Error('The workbook needs a sheet named “Roster”.');
    const relationshipId = Array.from(sheet.attributes).find(attribute => attribute.localName === "id")?.value;
    const relationships = await xml("xl/_rels/workbook.xml.rels");
    const relationship = elements(relationships, "Relationship").find(element => element.getAttribute("Id") === relationshipId);
    const target = relationship?.getAttribute("Target");
    if (!target || relationship.getAttribute("TargetMode") === "External") throw new Error("The roster sheet could not be opened.");
    const sheetPath = new URL(target, "https://workbook.invalid/xl/workbook.xml").pathname.slice(1);
    const strings = zip.file("xl/sharedStrings.xml")
      ? elements(await xml("xl/sharedStrings.xml"), "si").map(item => text(item, "t"))
      : [];
    const rows = elements(await xml(sheetPath), "row").map(row => ({
      number: Number(row.getAttribute("r")),
      cells: new Map(elements(row, "c").map(cell => {
        const column = cell.getAttribute("r")?.match(/^[A-Z]+/)?.[0];
        const value = text(cell, "v");
        const type = cell.getAttribute("t");
        return [column, type === "s" ? strings[Number(value)] || "" : type === "inlineStr" ? text(cell, "t") : value];
      }))
    }));
    const date1904 = ["1", "true"].includes(elements(workbook, "workbookPr")[0]?.getAttribute("date1904"));
    return rows.some(row => row.number <= 10 && row.cells.get("A") === "Session")
      ? organiseLegacy(rows)
      : organise(rows, date1904);
  }

  function formatDate(date) {
    return date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(2, 4)}` : "";
  }

  function parseDate(value, date1904) {
    if (!value) return "";
    const uk = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
    const iso = /^(\d{4}-\d{2}-\d{2})(?:T.*)?$/.exec(value);
    if (uk || iso) {
      const date = iso ? iso[1] : `${uk[3].padStart(4, "20")}-${uk[2].padStart(2, "0")}-${uk[1].padStart(2, "0")}`;
      const parsed = new Date(date);
      return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === date ? date : null;
    }
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 0 || serial >= 2957000 || !date1904 && serial < 1) return null;
    const offset = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, serial < 60 ? 31 : 30);
    return new Date(offset + Math.floor(serial) * 86400000).toISOString().slice(0, 10);
  }

  function compareSchedule(a, b) {
    const compare = (first, second) => first === second ? 0 : first < second ? -1 : 1;
    return compare(a.date || "~", b.date || "~") ||
      (a.order || Infinity) - (b.order || Infinity) || 0;
  }

  function organise(rows, date1904) {
    // Skip column C in earlier copies of the template.
    const lettersFor = row => {
      const hasTimeColumn = row.cells.get("C")?.trim() === "Time";
      return columns.map((_, index) => String.fromCharCode(65 + index + (hasTimeColumn && index >= 2 ? 1 : 0)));
    };
    const header = rows.find(row => row.number <= 10 && lettersFor(row).every((column, index) => row.cells.get(column)?.trim() === columns[index]));
    if (!header) throw new Error("The roster headings do not match the template. Keep the original headings and column order.");
    const letters = lettersFor(header);
    const pupils = [];
    for (const row of rows) {
      if (row.number <= header.number) continue;
      const values = letters.map(column => (row.cells.get(column) || "").trim());
      if (!values.some(Boolean)) continue;
      const [dateValue, orderValue, name, levelValue, teacher, assessor, instrument1] = values;
      const date = parseDate(dateValue, date1904);
      const order = orderValue === "" ? "" : Number(orderValue);
      const level = levels.find(option => key(option) === key(levelValue)) || "";
      const invalid = message => { throw new Error(`Roster row ${row.number}. ${message}`); };
      if (date === null) invalid("Enter the date in DD/MM/YY format or leave it blank.");
      if (order !== "" && (!Number.isSafeInteger(order) || order < 1)) invalid("Enter a positive whole number for Order or leave it blank.");
      if (levelValue && !level) invalid("Choose National 5, Higher or Advanced Higher, or leave Level blank.");
      pupils.push({
        name, level, date, order, teacher, assessor,
        instruments: [{ name: instrument1, pieces: values.slice(7, 15) }, { name: values[15], pieces: values.slice(16) }]
      });
    }
    if (!pupils.length) throw new Error("The roster sheet has no pupil rows to import.");
    return pupils.sort(compareSchedule);
  }

  function organiseLegacy(rows) {
    const header = rows.find(row => row.number <= 10 && Array.from(row.cells.values()).includes("Pupil Name"));
    const headings = new Map(Array.from(header?.cells || [], ([column, title]) => [title.trim(), column]));
    if (legacyColumns.some(title => !headings.has(title))) {
      throw new Error("The roster is missing a column heading. Copy your entries into a fresh template.");
    }
    const sessions = new Map();
    for (const row of rows) {
      if (row.number <= header.number) continue;
      const get = title => (row.cells.get(headings.get(title)) || "").trim();
      if (!legacyColumns.some(title => get(title))) continue;
      const invalid = message => { throw new Error(`Roster row ${row.number}. ${message}`); };
      const sessionName = get("Session");
      const name = get("Pupil Name");
      const order = Number(get("Running Order"));
      const level = levels.find(option => key(option) === key(get("Level")));
      if (!sessionName || !name) invalid("Enter a session and pupil name.");
      if (!Number.isSafeInteger(order) || order < 1) invalid("Enter a positive whole number for Running Order.");
      if (!level) invalid("Choose National 5, Higher or Advanced Higher.");
      const instruments = [1, 2].map(number => {
        const instrument = get(`Instrument ${number}`);
        const pieces = get(`Pieces ${number}`).split(/\r\n?|\n/).map(piece => piece.trim()).filter(Boolean);
        if (!instrument || !pieces.length) invalid(`Enter Instrument ${number} and its piece titles.`);
        if (pieces.length > 8) invalid(`Instrument ${number} can have up to eight pieces.`);
        return { name: instrument, pieces };
      });
      const sessionKey = key(sessionName);
      const assessor = get("Assessor");
      if (!sessions.has(sessionKey)) sessions.set(sessionKey, { key: sessionKey, name: sessionName, assessor, pupils: [] });
      const session = sessions.get(sessionKey);
      if (assessor && session.assessor && key(assessor) !== key(session.assessor)) invalid("Use the same assessor for this session, or give each assessor a distinct session name.");
      session.assessor ||= assessor;
      if (session.pupils.some(pupil => pupil.order === order)) invalid("This running order number already appears in the session.");
      session.pupils.push({ name, level, order, instruments, teachingClass: get("Teaching Class"), teacher: get("Teacher") });
    }
    if (!sessions.size) throw new Error("The roster sheet has no pupil rows to import.");
    return [...sessions.values()].flatMap(session =>
      session.pupils.sort((a, b) => a.order - b.order).map(pupil => ({
        ...pupil, assessor: session.assessor, session: session.name
      }))
    );
  }

  globalThis.AssessmentPrelimRoster = { read, compareSchedule, formatDate };
})();
