(() => {
  const overlay = document.getElementById("questionPaperAnalysisOverlay");
  const viewer = overlay.querySelector(".question-paper-viewer");
  const pages = overlay.querySelector(".question-paper-pages");
  const status = overlay.querySelector(".question-paper-status");
  const pdfLink = overlay.querySelector(".question-paper-open");
  const options = [...overlay.querySelectorAll("[data-analysis-src]")];
  const libraryUrl = new URL("../vendor/pdfjs/pdf.mjs", document.currentScript.src);
  let library;
  let active;

  function releasePage(report, holder) {
    const job = report.jobs.get(holder);
    if (!job) return;
    report.jobs.delete(holder);
    job.task?.cancel();
    if (job.canvas) job.canvas.width = 0;
    holder.replaceChildren();
  }

  function close() {
    const report = active;
    active = null;
    if (!report) return;
    report.observer?.disconnect();
    for (const holder of report.jobs.keys()) releasePage(report, holder);
    report.loading?.destroy().catch(() => {});
    pages.replaceChildren();
  }

  function appendSourceLinks(holder, annotations, viewport) {
    for (const { url, rect } of annotations) {
      if (!url || !rect || !/^https?:\/\//i.test(url)) continue;
      const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(rect);
      const link = document.createElement("a");
      const sourcePage = new URLSearchParams(new URL(url).hash.slice(1)).get("page");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.setAttribute("aria-label", sourcePage ? `Open source PDF, page ${sourcePage}` : "Open source PDF");
      link.style.left = `${100 * Math.min(x1, x2) / viewport.width}%`;
      link.style.top = `${100 * Math.min(y1, y2) / viewport.height}%`;
      link.style.width = `${100 * Math.abs(x2 - x1) / viewport.width}%`;
      link.style.height = `${100 * Math.abs(y2 - y1) / viewport.height}%`;
      holder.append(link);
    }
  }

  async function renderPage(report, holder, number) {
    if (active !== report || report.jobs.has(holder)) return;
    const job = {};
    report.jobs.set(holder, job);
    const isCurrent = () => active === report && report.jobs.get(holder) === job;
    try {
      const page = await report.pdf.getPage(number);
      if (!isCurrent()) return;
      const viewport = page.getViewport({ scale: Math.min(window.devicePixelRatio || 1, 2) });
      const canvas = document.createElement("canvas");
      job.canvas = canvas;
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `Page ${number} of ${report.pdf.numPages}`);
      holder.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      job.task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
      const [annotations] = await Promise.all([page.getAnnotations(), job.task.promise]);
      if (!isCurrent()) return;
      holder.append(canvas);
      appendSourceLinks(holder, annotations, viewport);
    } catch {
      if (isCurrent()) status.textContent = "A page could not load here. Choose Open PDF to view the report.";
    }
  }

  async function open() {
    close();
    const option = options.find(button => button.getAttribute("aria-pressed") === "true");
    const url = new URL(option.dataset.analysisSrc, document.baseURI);
    const report = { jobs: new Map() };
    active = report;
    pdfLink.href = url.href;
    viewer.setAttribute("aria-label", option.dataset.analysisTitle);
    viewer.scrollTop = 0;
    status.textContent = "Loading report…";
    try {
      library ||= import(libraryUrl.href).then(pdfjs => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdf.worker.mjs", libraryUrl).href;
        return pdfjs;
      }).catch(error => { library = null; throw error; });
      const pdfjs = await library;
      if (active !== report) return;
      report.loading = pdfjs.getDocument({ url: url.href, docBaseUrl: url.href, isEvalSupported: false });
      report.pdf = await report.loading.promise;
      if (active !== report) return;
      const firstPage = await report.pdf.getPage(1);
      if (active !== report) return;
      const size = firstPage.getViewport({ scale: 1 });
      report.observer = new IntersectionObserver(entries => {
        if (active !== report) return;
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting) renderPage(report, target, Number(target.dataset.page));
          else if (!target.contains(document.activeElement)) releasePage(report, target);
        }
      }, { root: viewer, rootMargin: "300px 0px" });
      status.textContent = "";
      for (let number = 1; number <= report.pdf.numPages; number++) {
        const holder = document.createElement("div");
        holder.className = "question-paper-page";
        holder.dataset.page = number;
        holder.style.aspectRatio = `${size.width} / ${size.height}`;
        pages.append(holder);
        report.observer.observe(holder);
      }
    } catch {
      if (active === report) status.textContent = "This report could not load here. Choose Open PDF to view it.";
    }
  }

  for (const option of options) {
    option.addEventListener("click", () => {
      if (option.getAttribute("aria-pressed") === "true") return;
      for (const button of options) button.setAttribute("aria-pressed", String(option === button));
      open();
    });
  }
  window.MLH.paperAnalysis = { open, close };
})();
