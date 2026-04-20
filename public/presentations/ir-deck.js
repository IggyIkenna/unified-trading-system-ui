/* global window, document */
(function () {
  "use strict";

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderSlide(slide) {
    const t = slide.type;
    switch (t) {
      case "cover":
        return renderCover(slide);
      case "doctrine":
        return renderDoctrine(slide);
      case "lifecycle-new":
        return renderLifecycle(slide);
      case "operations":
        return renderOperations(slide);
      case "breadth-matrix":
        return renderBreadthMatrix(slide);
      case "strategies":
        return renderStrategies(slide);
      case "traction":
        return renderTraction(slide);
      case "packaging":
        return renderPackaging(slide);
      case "flywheel":
        return renderFlywheel(slide);
      case "ask":
        return renderAsk(slide);
      case "faq":
        return renderFaq(slide);
      case "demo":
        return renderDemo(slide);
      case "timeline-matrix":
        return renderTimelineMatrix(slide);
      case "trajectory":
        return renderTrajectory(slide);
      default:
        return (
          '<div class="ir-card"><p class="ir-sub">Unknown slide type: <strong>' +
          escapeHtml(t) +
          "</strong></p></div>"
        );
    }
  }

  function renderCover(s) {
    const stats = (s.stats || [])
      .map(function (st) {
        return (
          '<div><div class="ir-stat-val">' +
          escapeHtml(st.value) +
          '</div><div class="ir-stat-lab">' +
          escapeHtml(st.label) +
          "</div></div>"
        );
      })
      .join("");
    return (
      '<div class="ir-center">' +
      '<h1 class="ir-h1">' +
      escapeHtml(s.title) +
      "</h1>" +
      '<p class="ir-sub" style="margin-left:auto;margin-right:auto">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-rule"></div>' +
      '<p style="margin-top:14px;font-size:12px;color:var(--ir-primary);font-weight:600;letter-spacing:0.14em;text-transform:uppercase">' +
      escapeHtml(s.tagline || "") +
      " | FCA Authorised | Ref 975797</p>" +
      '<div class="ir-grid-stats">' +
      stats +
      "</div></div>"
    );
  }

  function renderDoctrine(s) {
    const points = (s.points || [])
      .map(function (p) {
        return (
          '<div class="ir-row-prob-sol">' +
          '<div><div class="ir-mini-h bad">Problem</div><div style="font-size:13px;color:var(--ir-muted)">' +
          escapeHtml(p.problem) +
          "</div></div>" +
          '<div style="align-self:center;color:var(--ir-primary)">→</div>' +
          '<div><div class="ir-mini-h good">Solution</div><div style="font-size:13px;font-weight:600">' +
          escapeHtml(p.solution) +
          "</div></div>" +
          "</div>"
        );
      })
      .join("");
    const diffs = (s.differentiators || [])
      .map(function (d) {
        return '<div class="ir-diff">' + escapeHtml(d) + "</div>";
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-points-grid">' +
      points +
      "</div>" +
      (diffs ? '<div class="ir-diff-grid">' + diffs + "</div>" : "") +
      (s.conclusion
        ? '<div class="ir-callout"><p style="margin:0;font-size:14px;font-weight:600;color:var(--ir-primary)">' +
        escapeHtml(s.conclusion) +
        "</p></div>"
        : "") +
      "</div>"
    );
  }

  function renderLifecycle(s) {
    const stages = s.stages || [];
    const parts = [];
    for (let i = 0; i < stages.length; i++) {
      const st = stages[i];
      parts.push(
        '<div class="ir-stage"><div class="ir-stage-num">' +
        (i + 1) +
        "</div>" +
        '<div class="ir-stage-name">' +
        escapeHtml(st.name) +
        "</div>" +
        '<div class="ir-stage-desc">' +
        escapeHtml(st.desc) +
        "</div></div>",
      );
      if (i < stages.length - 1) {
        parts.push('<div class="ir-arrow">→</div>');
      }
    }
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-stages">' +
      parts.join("") +
      "</div></div>"
    );
  }

  function renderOperations(s) {
    const metrics = (s.metrics || [])
      .map(function (m) {
        return (
          '<div><div class="ir-metric-val">' +
          escapeHtml(m.value) +
          '</div><div class="ir-metric-lab">' +
          escapeHtml(m.label) +
          "</div></div>"
        );
      })
      .join("");
    const cols = (s.columns || [])
      .map(function (c) {
        const items = (c.items || [])
          .map(function (it) {
            return "<li>" + escapeHtml(it) + "</li>";
          })
          .join("");
        return (
          '<div class="ir-card ir-col"><h3>' +
          escapeHtml(c.title) +
          "</h3><ul>" +
          items +
          "</ul></div>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<div class="ir-ops-top"><h2 class="ir-h2" style="border:none;margin:0;padding:0">' +
      escapeHtml(s.title) +
      "</h2>" +
      (metrics ? '<div class="ir-metrics">' + metrics + "</div>" : "") +
      "</div>" +
      '<div class="ir-cols-3">' +
      cols +
      "</div>" +
      (s.callout
        ? '<div class="ir-callout" style="margin-top:14px;text-align:center"><p style="margin:0;font-size:13px;color:var(--ir-muted)">' +
        escapeHtml(s.callout) +
        "</p></div>"
        : "") +
      "</div>"
    );
  }

  function borderClass(color) {
    const map = {
      cyan: "border-cyan",
      green: "border-green",
      violet: "border-violet",
      amber: "border-amber",
      rose: "border-rose",
    };
    return map[color] || "border-cyan";
  }
  function textClass(color) {
    const map = {
      cyan: "text-cyan",
      green: "text-green",
      violet: "text-violet",
      amber: "text-amber",
      rose: "text-rose",
    };
    return map[color] || "text-cyan";
  }

  function renderBreadthMatrix(s) {
    const cols = s.columns || [];
    const template = "minmax(140px, 1.1fr) repeat(" + cols.length + ", minmax(0, 1fr))";
    const head =
      '<div class="ir-bm-head" style="grid-template-columns:' +
      template +
      '">' +
      '<div class="ir-bm-corner"></div>' +
      cols
        .map(function (c) {
          return '<div>' + escapeHtml(c) + "</div>";
        })
        .join("") +
      "</div>";
    const rows = (s.rows || [])
      .map(function (row, idx) {
        const cells = (row.cells || [])
          .map(function (cell) {
            return '<div>' + escapeHtml(cell) + "</div>";
          })
          .join("");
        return (
          '<div class="ir-bm-row ' +
          borderClass(row.color) +
          '" style="grid-template-columns:' +
          template +
          '">' +
          '<div class="ir-bm-asset ' +
          textClass(row.color) +
          '">' +
          escapeHtml(row.asset) +
          "</div>" +
          cells +
          "</div>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-bm-grid">' +
      head +
      rows +
      "</div></div>"
    );
  }

  function riskBorder(risk) {
    if (risk === "low") return "border-left:4px solid #34d399";
    if (risk === "medium") return "border-left:4px solid #fbbf24";
    if (risk === "high") return "border-left:4px solid #fb7185";
    return "";
  }

  function renderStrategies(s) {
    const rows = (s.families || [])
      .map(function (f) {
        return (
          "<tr style=\"" +
          riskBorder(f.risk) +
          "\">" +
          '<td class="name">' +
          escapeHtml(f.name) +
          "</td>" +
          "<td>" +
          escapeHtml(f.returns) +
          "</td>" +
          "<td>" +
          escapeHtml(f.drawdown) +
          "</td>" +
          "<td>" +
          escapeHtml(f.capacity) +
          "</td>" +
          "<td>" +
          escapeHtml(f.character) +
          "</td>" +
          "</tr>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-table-wrap"><table class="ir-table">' +
      "<thead><tr>" +
      "<th>Family</th><th>Return Range</th><th>Max Drawdown</th><th>Capacity</th><th>Character</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div>" +
      (s.callout
        ? '<div class="ir-callout" style="margin-top:14px"><p style="margin:0;font-size:13px;color:var(--ir-muted)">' +
        escapeHtml(s.callout) +
        "</p></div>"
        : "") +
      "</div>"
    );
  }

  function renderTraction(s) {
    const colClass = s.launchReady ? "cols-3" : "cols-2";
    function items(list, icon) {
      return (list || [])
        .map(function (it) {
          return (
            '<div class="ir-tr-item"><div style="flex-shrink:0;width:18px">' +
            icon +
            '</div><div><div style="font-weight:700;font-size:13px">' +
            escapeHtml(it.text) +
            '</div><div style="font-size:11px;color:var(--ir-muted);margin-top:4px">' +
            escapeHtml(it.detail) +
            "</div></div></div>"
          );
        })
        .join("");
    }
    const check =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
    const circle =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>';
    const arrow =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    let body =
      '<div class="ir-traction-grid ' +
      colClass +
      '">' +
      '<div class="ir-traction"><h3 class="em">' +
      escapeHtml(s.launchReady ? "Live & Revenue-Generating" : "Achieved") +
      "</h3>" +
      items(s.achieved, check) +
      "</div>" +
      '<div class="ir-traction"><h3 class="am">' +
      escapeHtml(s.launchReady ? "In Active Pipeline" : "In Progress") +
      "</h3>" +
      items(s.inProgress, circle) +
      "</div>";
    if (s.launchReady) {
      body +=
        '<div class="ir-traction"><h3 class="pr">Built & Launch-Ready</h3>' +
        items(s.launchReady, arrow) +
        "</div>";
    }
    body += "</div>";
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      body +
      (s.checkpoint
        ? '<div class="ir-callout" style="margin-top:16px"><p style="margin:0;font-size:13px;color:var(--ir-muted)">' +
        escapeHtml(s.checkpoint) +
        "</p></div>"
        : "") +
      "</div>"
    );
  }

  function renderPackaging(s) {
    const services = (s.services || [])
      .map(function (svc) {
        const tags = (svc.stages || [])
          .map(function (x) {
            return '<span class="ir-svc-tag">' + escapeHtml(x) + "</span>";
          })
          .join("");
        return (
          '<div class="ir-card">' +
          '<div style="font-weight:800;font-size:14px;margin-bottom:8px">' +
          escapeHtml(svc.name) +
          "</div>" +
          '<div style="margin-bottom:10px">' +
          tags +
          "</div>" +
          '<div style="font-size:12px;color:var(--ir-muted);margin-bottom:8px">' +
          escapeHtml(svc.desc) +
          "</div>" +
          '<div style="font-size:12px;font-weight:700;color:var(--ir-primary)">' +
          escapeHtml(svc.model) +
          "</div></div>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-pack-grid">' +
      services +
      "</div>" +
      (s.note ? '<p class="ir-muted-note">' + escapeHtml(s.note) + "</p>" : "") +
      "</div>"
    );
  }

  function renderFlywheel(s) {
    const funnel = s.funnel || [];
    const steps = [];
    for (let i = 0; i < funnel.length; i++) {
      const step = funnel[i];
      steps.push(
        '<div class="ir-fly-step ' +
        (step.active ? "on" : "") +
        '"><div class="n">' +
        escapeHtml(step.name) +
        '</div><div class="s">' +
        escapeHtml(step.sub) +
        "</div></div>",
      );
      if (i < funnel.length - 1) {
        steps.push('<div class="ir-arrow">→</div>');
      }
    }
    const examples = (s.examples || [])
      .map(function (ex) {
        return "<li>" + escapeHtml(ex) + "</li>";
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-fly">' +
      steps.join("") +
      "</div>" +
      '<div class="ir-fly-note">Regulatory coverage spans all stages</div>' +
      '<div class="ir-fly-split">' +
      '<div class="ir-card" style="text-align:center">' +
      '<p style="margin:0;font-size:13px;color:var(--ir-muted);line-height:1.6">The critical conversion is research to live.<br/>On most platforms, that transition requires a rewrite.<br/>On ours, it is a configuration change — same data,<br/>same features, same risk controls.</p>' +
      '<p style="margin:14px 0 0;font-size:14px;font-weight:700;color:var(--ir-primary)">That continuity is what makes the platform difficult to leave.</p>' +
      "</div>" +
      '<div class="ir-card ir-fly-examples"><h3 style="margin:0 0 10px;font-size:12px;color:var(--ir-primary);text-transform:uppercase;letter-spacing:0.1em">Cross-Sell Examples</h3><ul>' +
      examples +
      "</ul></div></div></div>"
    );
  }

  function renderAsk(s) {
    const asks = (s.asks || [])
      .map(function (a) {
        const lis = (a.items || [])
          .map(function (it) {
            return "<li>" + escapeHtml(it) + "</li>";
          })
          .join("");
        return (
          '<div class="ir-ask-card"><h3>' +
          escapeHtml(a.title) +
          "</h3><ul>" +
          lis +
          "</ul></div>"
        );
      })
      .join("");
    return (
      '<div class="ir-center">' +
      '<h1 class="ir-h1">' +
      escapeHtml(s.title) +
      "</h1>" +
      '<p class="ir-sub" style="margin-left:auto;margin-right:auto">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-rule"></div>' +
      '<div class="ir-ask-grid">' +
      asks +
      "</div>" +
      '<p class="ir-foot-note">Odum Research Ltd | FCA 975797 | ' +
      escapeHtml(s.contact || "") +
      " | odum-research.com</p></div>"
    );
  }

  function renderFaq(s) {
    const qs = (s.questions || [])
      .map(function (q) {
        return (
          '<div class="ir-faq-item"><div class="ir-faq-q">' +
          escapeHtml(q.q) +
          '</div><div class="ir-faq-a">' +
          escapeHtml(q.a) +
          "</div></div>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-faq">' +
      qs +
      "</div></div>"
    );
  }

  function absUrl(path) {
    if (!path) return "#";
    if (/^https?:\/\//i.test(path)) return path;
    return "https://app.odum-research.co.uk" + path;
  }

  function renderDemo(s) {
    const sections = (s.sections || [])
      .map(function (sec) {
        const inner =
          '<div class="t">' +
          escapeHtml(sec.name) +
          '</div><div class="d">' +
          escapeHtml(sec.desc) +
          "</div>";
        if (sec.link) {
          return (
            '<a class="ir-demo-card" href="' +
            escapeHtml(absUrl(sec.link)) +
            '" target="_blank" rel="noopener noreferrer">' +
            inner +
            "</a>"
          );
        }
        return '<div class="ir-demo-card">' + inner + "</div>";
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-demo-grid">' +
      sections +
      "</div>" +
      (s.note ? '<p class="ir-muted-note">' + escapeHtml(s.note) + "</p>" : "") +
      "</div>"
    );
  }

  function pillClass(status) {
    if (!status) return "empty";
    if (status === "live") return "live";
    if (status === "testing") return "testing";
    if (status === "available") return "available";
    return "empty";
  }

  function renderTimelineMatrix(s) {
    const periods = s.periods || [];
    const n = periods.length;
    const template = "200px repeat(" + n + ", minmax(0, 1fr))";
    const head =
      '<div class="ir-tm-head" style="grid-template-columns:' +
      template +
      '">' +
      "<div></div>" +
      periods
        .map(function (p) {
          return "<div>" + escapeHtml(p) + "</div>";
        })
        .join("") +
      "</div>";
    const rows = (s.strategies || [])
      .map(function (str, idx) {
        const cells = (str.statuses || []).map(function (status) {
          if (!status) {
            return '<div><span class="ir-pill empty"></span></div>';
          }
          return (
            '<div><span class="ir-pill ' +
            pillClass(status) +
            '">' +
            escapeHtml(status) +
            "</span></div>"
          );
        });
        return (
          '<div class="ir-tm-row" style="grid-template-columns:' +
          template +
          '">' +
          "<div>" +
          escapeHtml(str.name) +
          "</div>" +
          cells.join("") +
          "</div>"
        );
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-tm-grid">' +
      head +
      rows +
      "</div></div>"
    );
  }

  function renderTrajectory(s) {
    const milestones = s.milestones || [];
    const n = milestones.length || 1;
    const barMaxPx = 200;
    const bars = milestones
      .map(function (m, i) {
        const h = Math.round(((i + 1) / n) * barMaxPx);
        return (
          '<div class="ir-traj-bar ' +
          (m.active ? "on" : "") +
          '" style="height:' +
          h +
          'px">' +
          '<div class="ir-traj-val">' +
          escapeHtml(m.value) +
          '</div><div class="ir-traj-detail">' +
          escapeHtml(m.detail) +
          "</div></div>"
        );
      })
      .join("");
    const dates = milestones
      .map(function (m) {
        return '<div>' + escapeHtml(m.date) + "</div>";
      })
      .join("");
    return (
      "<div>" +
      '<h2 class="ir-h2">' +
      escapeHtml(s.title) +
      "</h2>" +
      '<p class="ir-sub">' +
      escapeHtml(s.subtitle) +
      "</p>" +
      '<div class="ir-traj-bars">' +
      bars +
      "</div>" +
      '<div class="ir-traj-dates">' +
      dates +
      "</div>" +
      (s.callout
        ? '<div class="ir-callout" style="margin-top:16px"><p style="margin:0;font-size:13px;color:var(--ir-muted)">' +
        escapeHtml(s.callout) +
        "</p></div>"
        : "") +
      "</div>"
    );
  }

  function mount() {
    const cfg = window.IR_DECK;
    if (!cfg || !Array.isArray(cfg.slides)) {
      console.error("IR_DECK.slides missing");
      return;
    }
    const slides = cfg.slides;
    let idx = 0;
    const titleEl = document.getElementById("ir-deck-title");
    const subEl = document.getElementById("ir-deck-subtitle");
    const mainEl = document.getElementById("ir-slide-main");
    const prevBtn = document.getElementById("ir-prev");
    const nextBtn = document.getElementById("ir-next");
    const counterEl = document.getElementById("ir-counter");
    const dotsEl = document.getElementById("ir-dots");

    if (titleEl) titleEl.textContent = cfg.title || "Presentation";
    if (subEl) {
      subEl.textContent = cfg.subtitle || "";
      subEl.style.display = cfg.subtitle ? "block" : "none";
    }

    function renderDots() {
      if (!dotsEl) return;
      dotsEl.innerHTML = "";
      for (let i = 0; i < slides.length; i++) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "ir-dot" + (i === idx ? " active" : "");
        b.setAttribute("aria-label", "Go to slide " + (i + 1));
        b.addEventListener("click", function () {
          idx = i;
          paint();
        });
        dotsEl.appendChild(b);
      }
    }

    function paint() {
      if (mainEl) {
        mainEl.innerHTML = '<div class="ir-slide-wrap">' + renderSlide(slides[idx]) + "</div>";
      }
      if (counterEl) {
        counterEl.textContent = idx + 1 + " / " + slides.length;
      }
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === slides.length - 1;
      renderDots();
      document.title = (cfg.title || "Presentation") + " — slide " + (idx + 1);
    }

    function goPrev() {
      idx = Math.max(0, idx - 1);
      paint();
    }
    function goNext() {
      idx = Math.min(slides.length - 1, idx + 1);
      paint();
    }

    if (prevBtn) prevBtn.addEventListener("click", goPrev);
    if (nextBtn) nextBtn.addEventListener("click", goNext);

    window.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goPrev();
      }
    });

    paint();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
