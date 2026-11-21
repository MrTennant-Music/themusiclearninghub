const footerScriptUrl = document.currentScript?.src || window.location.href;

const hasHubUiStylesheet = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
  .some(link => {
    try {
      return new URL(link.href, window.location.href).pathname.endsWith("/styles/hub-ui.css");
    } catch {
      return link.getAttribute("href")?.split("?")[0].endsWith("styles/hub-ui.css");
    }
  });

if (!hasHubUiStylesheet) {
  const hubStyle = document.createElement("link");
  hubStyle.rel = "stylesheet";
  hubStyle.href = new URL("./styles/hub-ui.css?v=20261024-scroll-fades-v2", footerScriptUrl).href;
  document.head.appendChild(hubStyle);
}

const footerShellClass = window.MLH?.shell?.footerShellClass || "bg-white";
if (!document.getElementById('mlh-close-controls-script')) {
  const closeControls = document.createElement('script');
  closeControls.id = 'mlh-close-controls-script';
  closeControls.src = new URL('./shared/hub-close-controls.js?v=61b2567261e4', footerScriptUrl).href;
  document.head.appendChild(closeControls);
}
const footerHomeUrl = new URL("./", footerScriptUrl).href;
const footerLogoUrl = new URL("./app-icons/the-music-learning-hub-logo.svg", footerScriptUrl).href;

document.body.insertAdjacentHTML("beforeend", `
<footer class="footer ${footerShellClass}" id="resources">
  <div class="footer-grid">

    <div class="footer-brand">
      <a href="${footerHomeUrl}" aria-label="Return to Music Learning Hub home page">
        <img
          src="${footerLogoUrl}"
          alt="The Music Learning Hub"
          class="brand-wordmark footer-wordmark"
        />
      </a>
    </div>

    <div>
      <h4>About</h4>
      <p>
        Interactive resources for learning and teaching music.
        Find out more
        <a class="text-link" href="#" data-open="aboutOverlay">here</a>.
      </p>
    </div>

    <div>
      <h4>Feedback</h4>
      <p>
        If you have any suggestions on how to improve the Hub,
        please click
        <a
          class="text-link"
          href="https://forms.cloud.microsoft/e/vW5PPdW154"
          target="_blank"
          rel="noopener noreferrer"
        >here</a>.
      </p>
    </div>

    <div id="contact">
      <h4>Contact</h4>
      <p>
        Robert Tennant<br />
        Teacher of Music<br />
        gw19tennantrobert1@<wbr>glow.sch.uk
      </p>
    </div>

  </div>

  <div class="copyright">
    The Music Learning Hub · <a class="version-link" href="#versionOverlay" data-open="versionOverlay">Version 2.0</a> · 2026
  </div>
</footer>

<div id="aboutOverlay" class="overlay">
  <div class="modal">
    <button class="close-btn" type="button" data-close aria-label="Close About information">×</button>
    <h2>About</h2>
    <p>The Music Learning Hub brings together interactive learning resources and classroom tools to help pupils understand music. It develops music literacy alongside a broader understanding of musical concepts through exploration, practice and play.</p>
    <p>Organised by level and topic from <strong>National 3</strong> to <strong>Advanced Higher</strong>, the Hub supports classroom teaching, revision and independent study around <strong>Qualifications Scotland</strong> music concepts.</p>
    <p>Built by a music teacher, combining classroom experience with AI-assisted development.</p>
  </div>
</div>

<div id="versionOverlay" class="overlay">
  <div class="modal" role="dialog" aria-modal="true" aria-labelledby="versionOverlayTitle">
    <button class="close-btn" type="button" data-close aria-label="Close updates">×</button>
    <h2 id="versionOverlayTitle">Updates</h2>
    <div class="release-notes-content" role="region" aria-label="Update history" tabindex="0">
    <p class="release-notes-version"><strong>Version 2.0 • <time datetime="2026-11">November 2026</time></strong></p>
    <ul class="release-notes-list">
      <li>Updated the name to <strong>The Music Learning Hub</strong>, bringing music literacy, listening, games, performing, composing and teaching tools together.</li>
      <li>Added <strong>Escape Room</strong>: explore six rooms, solve musical knowledge, literacy and listening clues, and use the answers to unlock each door. Includes object sound effects, hints and medal rewards.</li>
      <li>Added <strong>Music Dictionary</strong> from National 3 to Advanced Higher, with definitions, listening guidance, audio and video examples, related concepts, revision groups and links to practice activities.</li>
      <li>Added <strong>Concept Audio Library</strong>, a repository of concept audio examples from National 3 to Advanced Higher.</li>
      <li>Added <strong>Exam Trends</strong> to the Dictionary, showing how often concepts appear in reviewed listening papers and linking to relevant questions in the Digital Question Papers.</li>
      <li>Added <strong>Digital Question Papers</strong> at Advanced Higher level.</li>
      <li>Expanded <strong>Practice Questions</strong> with exam-style literacy tasks, audio, marking feedback, worksheets and a full-screen score view for longer questions.</li>
      <li>Added <strong>Keyboard Note Identification</strong> from National 3 to Advanced Higher. Name highlighted keys or match written notes to keys, with level-specific options and printable worksheets.</li>
      <li>Added <strong>Crosswords</strong>, <strong>Connections</strong>, <strong>Word Search</strong>, <strong>Concept Sort</strong> and <strong>Concept Charades</strong>, available from the Games section.</li>
      <li>Added <strong>Composition Studio</strong> for creating and playing chord progressions, melodies and drum patterns.</li>
      <li>Added <strong>Digital Performance Assessment</strong> for recording performing assessments, feedback and marks.</li>
      <li>Added <strong>Interactive Piano</strong> for playing notes and chords with a mouse, touchscreen or computer keyboard.</li>
      <li>Added <strong>Classroom Timer</strong> with countdowns, stopwatches and custom labels for classroom activities.</li>
      <li>Added <strong>Stave Paper Generator</strong> for creating and downloading blank and piano manuscript paper.</li>
      <li>Added <strong>Chromatic Tuner</strong> with live pitch feedback and guided string tuning for guitar, bass guitar, ukulele and violin.</li>
      <li><strong>Experimental:</strong> Host a Game in <strong>Keyboard Note Identification</strong>. Participants can join by QR code and compete in a Quiz or Race. This feature is still being tested and may change.</li>
      <li>Improved navigation, activity controls, notation, accessibility and the fitted desktop layout across the Hub.</li>
      <li>Bug fixes and other improvements across the Hub.</li>
    </ul>
    <p class="release-notes-version"><strong>Version 1.1 • <time datetime="2026-10">October 2026</time></strong></p>
    <ul class="release-notes-list">
      <li>Added and expanded <strong>Ear Training</strong> (formerly Aural Recognition) from National 3 to Advanced Higher, with customisable listening exercises, generated musical excerpts and choice or typed answers.</li>
      <li>Added <strong>Family Fortunes</strong> from National 3 to Advanced Higher, with two-team play, face-offs, play or pass, steals, scoring and editable rounds.</li>
      <li>Added <strong>Metronome</strong> with adjustable tempo, tap tempo, beats per bar, accents and subdivisions.</li>
      <li>Bug fixes and other improvements across the Hub.</li>
    </ul>
    <p class="release-notes-version"><strong>Version 1.0 • <time datetime="2026-08">August 2026</time></strong></p>
    <ul class="release-notes-list">
      <li>Initial release of The Music Learning Hub.</li>
    </ul>
    </div>
  </div>
</div>
`);

const footerStyle = document.createElement("style");
footerStyle.textContent = `
  .footer .footer-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  }

  .footer .footer-brand {
    justify-content: center;
  }

  .footer .footer-wordmark {
    width: 187px !important;
    transform: translateX(-12px);
  }



  .footer .text-link:hover,
  .footer .text-link:focus-visible {
    text-decoration: underline !important;
  }

  .footer .version-link {
    color: inherit;
    font-weight: 400;
    text-decoration: none;
  }

  .footer .version-link:hover,
  .footer .version-link:focus-visible {
    text-decoration: underline;
  }

  #aboutOverlay .close-btn,
  #versionOverlay .close-btn {
    color: #000;
    right: 14px;
    width: 38px;
    height: 38px;
    background: #eff6ff;
    font-weight: 700;
  }

  #aboutOverlay .modal,
  #versionOverlay .modal {
    box-sizing: border-box;
    min-width: 0;
    width: min(100%, 560px);
    max-height: 90vh;
    padding: 28px;
    border-radius: 24px;
    background: #fff;
    box-shadow: 0 24px 60px rgba(0, 0, 0, .25);
  }

  #aboutOverlay .modal p {
    color: #000;
  }

  /* Keep the title and close button outside the scrolling release notes. */
  #versionOverlay .modal {
    display: flex;
    flex-direction: column;
    width: min(100%, 700px);
    overflow: hidden;
  }

  #versionOverlayTitle {
    flex-shrink: 0;
    padding-right: 44px;
  }

  #versionOverlay .close-btn { z-index: 2; }
  #versionOverlay .release-notes-content {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  #versionOverlay .release-notes-version {
    color: #000;
  }

  #versionOverlay .release-notes-list + .release-notes-version {
    margin-top: 24px;
  }

  #versionOverlay .release-notes-list {
    margin: 0;
    padding-left: 22px;
    list-style: disc outside;
    color: #000;
    line-height: 1.55;
  }

  #versionOverlay .release-notes-list li + li {
    margin-top: 10px;
  }
`;
document.head.appendChild(footerStyle);

document.addEventListener("click", event => {
  const opener = event.target.closest("[data-open='aboutOverlay'], [data-open='versionOverlay']");

  if (opener) {
    event.preventDefault();
    document.getElementById(opener.dataset.open)?.classList.add("is-open");
    return;
  }

  const closeButton = event.target.closest("[data-close]");

  if (closeButton) {
    closeButton.closest(".overlay")?.classList.remove("is-open");
    return;
  }

  if (event.target.classList.contains("overlay")) {
    event.target.classList.remove("is-open");
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document
      .querySelectorAll(".overlay.is-open")
      .forEach(overlay => overlay.classList.remove("is-open"));
  }
});
