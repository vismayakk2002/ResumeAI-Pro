import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const COLORS = {
  ink: "#1F2937",
  heading: "#111827",
  accent: "#1D4ED8",
  gray: "#4B5563",
  lightGray: "#9CA3AF",
  border: "#D1D5DB",
  chipBg: "#EFF3FB",
};

// ---------------------------------------------------------------------
// CONTENT ESTIMATION
//
// react-pdf renders declaratively in one pass — it can't tell us "this
// overflowed to page 2" the way a browser layout engine could. So instead
// of reacting to overflow after the fact, we simulate it up front: for a
// given tier's font sizes, approximate how many lines each block of text
// will wrap to (using an average Helvetica character-width ratio), sum
// the estimated height of the whole document, and compare it to the
// usable page height. This is still a heuristic — react-pdf's real text
// engine measures actual glyph widths — but it tracks reality far better
// than counting raw characters, because short lines (a bullet that's
// just a word or two) still cost a full row of vertical space, and long
// lines cost multiple rows once they wrap.
// ---------------------------------------------------------------------

// Average width of a Helvetica character as a fraction of its font size.
// (Real widths vary per glyph; this is a standard approximation used for
// this kind of estimate.)
const AVG_CHAR_WIDTH_RATIO = 0.52;

const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  LEGAL: { width: 612, height: 1008 },
};

// Coerces anything the AI response might put in a "text" field — a
// plain string, an array of strings/objects, or a single object — into
// a flat string. The optimize/rewrite endpoints aren't always consistent
// about returning "responsibilities" or "description" as a plain string
// vs an array of bullet strings, and this needs to survive either.
function asText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v
      .map((item) =>
        typeof item === "string" ? item : item?.text || item?.description || ""
      )
      .join("\n");
  }
  if (typeof v === "object") return v.text || v.description || "";
  return String(v);
}

function textLen(s) {
  return typeof s === "string" ? s.length : 0;
}

// Estimated number of wrapped lines for a run of text at a given font
// size within a given content width.
function wrappedLineCount(text, fontSize, contentWidth) {
  const len = textLen(text);
  if (len === 0) return 0;
  const charsPerLine = Math.max(
    1,
    Math.floor(contentWidth / (fontSize * AVG_CHAR_WIDTH_RATIO))
  );
  return Math.max(1, Math.ceil(len / charsPerLine));
}

function estimateDocHeight(resume, tier) {
  const t = DENSITY_TIERS[tier];
  const page = PAGE_SIZES[t.pageSize];
  const contentWidth = page.width - 2 * t.pagePaddingH;
  const personal = resume.personal || {};

  let h = 0;

  // ---- Header ----
  h += t.nameFontSize * 1.15 + 6; // name line + its marginBottom
  const contactParts = [
    personal.location,
    personal.phone,
    personal.email,
  ].filter(Boolean);
  if (contactParts.length > 0) h += (t.baseFontSize - 1) * 1.3 + 3;
  if (personal.linkedin || personal.github) {
    h += (t.baseFontSize - 1) * 1.3 + 3;
  }
  h += t.headerPaddingBottom + t.headerMarginBottom;

  const sectionTitleHeight =
    t.sectionTitleFontSize * 1.3 + 4 + t.sectionMarginBottom / 2;

  // ---- Summary ----
  const summaryText = asText(resume.summary);
  if (summaryText) {
    h += sectionTitleHeight;
    const lines = wrappedLineCount(
      summaryText,
      t.baseFontSize - 0.5,
      contentWidth
    );
    h += lines * (t.baseFontSize - 0.5) * t.lineHeight;
    h += t.sectionMarginBottom;
  }

  // ---- Skills ----
  if (resume.skills?.length) {
    h += sectionTitleHeight;
    const chipFont = t.baseFontSize - 1.5;
    let rowWidth = 0;
    let rows = 1;
    resume.skills.forEach((s) => {
      const name = typeof s === "string" ? s : s?.name || "";
      const chipWidth = textLen(name) * chipFont * AVG_CHAR_WIDTH_RATIO + 18 + 6;
      if (rowWidth + chipWidth > contentWidth) {
        rows += 1;
        rowWidth = chipWidth;
      } else {
        rowWidth += chipWidth;
      }
    });
    h += rows * (chipFont * 1.3 + 8 + 6);
    h += t.sectionMarginBottom;
  }

  // ---- Experience ----
  const experienceEntries = (resume.experience || []).filter(
    (e) => e.company || e.role
  );
  if (experienceEntries.length) {
    h += sectionTitleHeight;
    experienceEntries.forEach((exp) => {
      h += t.cardTitleFontSize * 1.2 + (t.baseFontSize - 0.5) * 1.2 + 1; // title + subtitle
      const bullets = getBullets(exp.responsibilities);
      bullets.forEach((b) => {
        const lines = wrappedLineCount(
          b,
          t.baseFontSize - 0.5,
          contentWidth - 10
        );
        h += t.bulletRowMarginTop + lines * (t.baseFontSize - 0.5) * t.lineHeight;
      });
      h += t.cardMarginBottom;
    });
    h += t.sectionMarginBottom;
  }

  // ---- Projects ----
  const projectEntries = (resume.projects || []).filter(
    (p) => p.title || p.description
  );
  if (projectEntries.length) {
    h += sectionTitleHeight;
    projectEntries.forEach((p) => {
      h += t.cardTitleFontSize * 1.2;
      const lines = wrappedLineCount(
        asText(p.description),
        t.baseFontSize - 0.5,
        contentWidth
      );
      h += 3 + lines * (t.baseFontSize - 0.5) * t.lineHeight;
      h += t.cardMarginBottom;
    });
    h += t.sectionMarginBottom;
  }

  // ---- Education ----
  const educationEntries = (resume.education || []).filter(
    (e) => e.college || e.degree
  );
  if (educationEntries.length) {
    h += sectionTitleHeight;
    educationEntries.forEach(() => {
      h += t.cardTitleFontSize * 1.2 + (t.baseFontSize - 0.5) * 1.2 + 1;
      h += t.cardMarginBottom;
    });
    h += t.sectionMarginBottom;
  }

  // ---- Achievements ----
  const dedupedAchievements = dedupeAchievements(resume.achievements);
  if (dedupedAchievements.length) {
    h += sectionTitleHeight;
    dedupedAchievements.forEach((a) => {
      const lines = wrappedLineCount(
        getAchievementText(a),
        t.baseFontSize - 0.5,
        contentWidth - 10
      );
      h += t.bulletRowMarginTop + lines * (t.baseFontSize - 0.5) * t.lineHeight;
    });
    h += t.sectionMarginBottom;
  }

  return h;
}

// Density tiers, roughly calibrated so that:
//  - "normal"  fits a light 1-page resume comfortably
//  - "compact" fits a fuller resume onto A4/Letter
//  - "tight"   squeezes a dense resume onto A4/Letter
//  - "legal"   only kicks in when even "tight" likely wouldn't fit —
//              switches physical page size instead of shrinking further,
//              so text never becomes illegibly small
const DENSITY_TIERS = {
  normal: {
    pageSize: "A4",
    baseFontSize: 10.5,
    nameFontSize: 24,
    sectionTitleFontSize: 11.5,
    cardTitleFontSize: 11,
    lineHeight: 1.5,
    pagePaddingV: 40,
    pagePaddingH: 48,
    sectionMarginBottom: 16,
    cardMarginBottom: 12,
    headerPaddingBottom: 14,
    headerMarginBottom: 18,
    bulletRowMarginTop: 5,
  },
  compact: {
    pageSize: "A4",
    baseFontSize: 9.5,
    nameFontSize: 21,
    sectionTitleFontSize: 10.5,
    cardTitleFontSize: 10,
    lineHeight: 1.4,
    pagePaddingV: 32,
    pagePaddingH: 42,
    sectionMarginBottom: 11,
    cardMarginBottom: 9,
    headerPaddingBottom: 10,
    headerMarginBottom: 14,
    bulletRowMarginTop: 3.5,
  },
  tight: {
    pageSize: "A4",
    baseFontSize: 8.75,
    nameFontSize: 19,
    sectionTitleFontSize: 9.75,
    cardTitleFontSize: 9.25,
    lineHeight: 1.32,
    pagePaddingV: 26,
    pagePaddingH: 36,
    sectionMarginBottom: 8,
    cardMarginBottom: 6.5,
    headerPaddingBottom: 8,
    headerMarginBottom: 10,
    bulletRowMarginTop: 2.5,
  },
  legal: {
    // Same "tight" text sizing (so it still reads like the same resume),
    // just on a taller sheet — this is the "automatically switch layout"
    // fallback for genuinely dense resumes.
    pageSize: "LEGAL",
    baseFontSize: 9.25,
    nameFontSize: 20,
    sectionTitleFontSize: 10,
    cardTitleFontSize: 9.5,
    lineHeight: 1.38,
    pagePaddingV: 30,
    pagePaddingH: 40,
    sectionMarginBottom: 10,
    cardMarginBottom: 8,
    headerPaddingBottom: 10,
    headerMarginBottom: 14,
    bulletRowMarginTop: 3,
  },
  "legal-tight": {
    // Last resort: legal paper AND tighter sizing. Only reached by
    // resumes with a genuinely large amount of content.
    pageSize: "LEGAL",
    baseFontSize: 8.25,
    nameFontSize: 18,
    sectionTitleFontSize: 9.25,
    cardTitleFontSize: 8.75,
    lineHeight: 1.28,
    pagePaddingV: 24,
    pagePaddingH: 34,
    sectionMarginBottom: 7,
    cardMarginBottom: 5.5,
    headerPaddingBottom: 7,
    headerMarginBottom: 9,
    bulletRowMarginTop: 2,
  },
};

// Try tiers in order of "most spacious" to "most compact" and use the
// first one whose estimated content height actually fits the page. If
// even the last (most compact) tier doesn't fit, we still use it — it's
// the best available approximation, and a small overflow onto a second
// page beats illegibly small text.
const TIER_ORDER = ["normal", "compact", "tight", "legal", "legal-tight"];

function pickDensityTier(resume) {
  for (const tier of TIER_ORDER) {
    const t = DENSITY_TIERS[tier];
    const page = PAGE_SIZES[t.pageSize];
    const usableHeight = page.height - 2 * t.pagePaddingV;
    const estimated = estimateDocHeight(resume, tier);
    if (estimated <= usableHeight) return tier;
  }
  return TIER_ORDER[TIER_ORDER.length - 1];
}

function buildStyles(tier) {
  const t = DENSITY_TIERS[tier];

  return StyleSheet.create({
    page: {
      backgroundColor: "#FFFFFF",
      fontFamily: "Helvetica",
      fontSize: t.baseFontSize,
      color: COLORS.ink,
      paddingTop: t.pagePaddingV,
      paddingBottom: t.pagePaddingV,
      paddingHorizontal: t.pagePaddingH,
    },

    // ---------- HEADER ----------
    header: {
      textAlign: "center",
      borderBottomWidth: 2,
      borderBottomColor: COLORS.heading,
      paddingBottom: t.headerPaddingBottom,
      marginBottom: t.headerMarginBottom,
    },

    name: {
      fontSize: t.nameFontSize,
      fontWeight: "bold",
      letterSpacing: 1,
      color: COLORS.heading,
      textAlign: "center",
      marginBottom: 6,
    },

    contactRow: {
      flexDirection: "row",
      justifyContent: "center",
      flexWrap: "wrap",
      fontSize: t.baseFontSize - 1,
      color: COLORS.gray,
      marginBottom: 3,
    },

    contactItem: {
      marginHorizontal: 6,
    },

    // ---------- SECTIONS ----------
    section: {
      marginBottom: t.sectionMarginBottom,
    },

    sectionTitle: {
      fontSize: t.sectionTitleFontSize,
      fontWeight: "bold",
      color: COLORS.heading,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      paddingBottom: 4,
      marginBottom: t.sectionMarginBottom / 2,
    },

    summaryText: {
      fontSize: t.baseFontSize - 0.5,
      lineHeight: t.lineHeight,
      color: COLORS.ink,
      textAlign: "justify",
    },

    // ---------- SKILLS ----------
    skillsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    skillChip: {
      backgroundColor: COLORS.chipBg,
      color: COLORS.heading,
      fontSize: t.baseFontSize - 1.5,
      paddingVertical: tier === "normal" ? 4 : 3,
      paddingHorizontal: 9,
      borderRadius: 3,
      marginRight: 6,
      marginBottom: 6,
    },

    // ---------- CARDS ----------
    card: {
      marginBottom: t.cardMarginBottom,
    },

    cardHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    cardTitle: {
      fontSize: t.cardTitleFontSize,
      fontWeight: "bold",
      color: COLORS.heading,
    },

    cardSubtitle: {
      fontSize: t.baseFontSize - 0.5,
      color: COLORS.gray,
      marginTop: 1,
    },

    cardMeta: {
      fontSize: t.baseFontSize - 1,
      color: COLORS.lightGray,
      fontWeight: "bold",
    },

    bulletRow: {
      flexDirection: "row",
      marginTop: t.bulletRowMarginTop,
      paddingLeft: 2,
    },

    bulletDash: {
      fontSize: t.baseFontSize - 0.5,
      width: 10,
      color: COLORS.gray,
    },

    bulletText: {
      fontSize: t.baseFontSize - 0.5,
      lineHeight: t.lineHeight,
      flex: 1,
      color: COLORS.ink,
    },

    normalText: {
      fontSize: t.baseFontSize - 0.5,
      lineHeight: t.lineHeight,
      color: COLORS.ink,
      marginTop: 3,
    },

    smallText: {
      fontSize: t.baseFontSize - 1,
      color: COLORS.lightGray,
    },
  });
}

// Splits a "responsibilities" value into individual bullet lines. Accepts
// either a newline-separated string (the intended shape) OR an array of
// strings/objects (what the AI service sometimes returns instead) so a
// shape mismatch here can't crash PDF generation. Also drops lines that
// are just stray punctuation (e.g. a lone "-", ".", or "- -" with
// whitespace in between) — these show up as empty bullets when the
// source data has leftover placeholder/separator rows, and they waste a
// full row of vertical space for no content.
function getBullets(text) {
  if (!text) return [];

  const rawLines = Array.isArray(text)
    ? text.map((item) =>
        typeof item === "string" ? item : item?.text || item?.description || ""
      )
    : asText(text).split("\n");

  return rawLines
    .map((line) => (typeof line === "string" ? line.trim() : ""))
    .filter((line) => {
      if (line.length === 0) return false;
      const stripped = line.replace(/\s+/g, "");
      return !/^[.\-•*]+$/.test(stripped);
    });
}

// De-duplicates achievements that are exact repeats (case/whitespace
// insensitive) — this can happen when the same entry gets saved twice in
// the source data.
function dedupeAchievements(achievements) {
  if (!achievements?.length) return [];
  const seen = new Set();
  const result = [];
  achievements.forEach((a) => {
    const text = getAchievementText(a).trim();
    const key = text.toLowerCase();
    if (text && !seen.has(key)) {
      seen.add(key);
      result.push(a);
    }
  });
  return result;
}

// Normalizes achievements, which may be an array of strings or {id, text} objects
function getAchievementText(achievement) {
  return typeof achievement === "string" ? achievement : achievement?.text || "";
}

export function ResumeDocument({ resume, forceTier }) {
  const tier = forceTier || pickDensityTier(resume);
  const styles = buildStyles(tier);
  const pageSize = DENSITY_TIERS[tier].pageSize;

  // Guard against the AI-optimized resume omitting "personal" entirely —
  // without this, resume.personal.fullName throws and PDF generation
  // fails with a generic "couldn't generate" error.
  const personal = resume.personal || {};

  const contactParts = [
    personal.location,
    personal.phone,
    personal.email,
  ].filter(Boolean);

  const hasSkills = resume.skills && resume.skills.length > 0;
  const hasExperience = resume.experience && resume.experience.some(e => e.company || e.role);
  const hasEducation = resume.education && resume.education.some(e => e.college || e.degree);
  const hasProjects = resume.projects && resume.projects.some(p => p.title || p.description);
  const achievements = dedupeAchievements(resume.achievements);
  const hasAchievements = achievements.length > 0;

  return (
    <Document>

      <Page size={pageSize} style={styles.page}>

        {/* HEADER */}

        <View style={styles.header}>

          <Text style={styles.name}>
            {personal.fullName || ""}
          </Text>

          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              <Text>{contactParts.join("  |  ")}</Text>
            </View>
          )}

          {(personal.linkedin || personal.github) && (
            <View style={styles.contactRow}>
              {personal.linkedin ? (
                <Text style={styles.contactItem}>LinkedIn: {personal.linkedin}</Text>
              ) : null}
              {personal.github ? (
                <Text style={styles.contactItem}>GitHub: {personal.github}</Text>
              ) : null}
            </View>
          )}

        </View>

        {/* PROFESSIONAL SUMMARY */}

        {asText(resume.summary) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summaryText}>{asText(resume.summary)}</Text>
          </View>
        ) : null}

        {/* SKILLS */}

        {hasSkills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technical Skills</Text>
            <View style={styles.skillsWrap}>
              {resume.skills.map((skill, index) => (
                <Text key={skill?.id ?? index} style={styles.skillChip}>
                  {typeof skill === "string" ? skill : skill?.name || ""}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* EXPERIENCE */}

        {hasExperience && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>

            {resume.experience.map((exp, index) => (
              (exp.company || exp.role) && (
                <View key={exp.id ?? index} style={styles.card}>

                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardTitle}>{exp.role}</Text>
                      <Text style={styles.cardSubtitle}>{exp.company}</Text>
                    </View>
                    <Text style={styles.cardMeta}>{exp.duration}</Text>
                  </View>

                  {getBullets(exp.responsibilities).map((line, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Text style={styles.bulletDash}>-</Text>
                      <Text style={styles.bulletText}>{line}</Text>
                    </View>
                  ))}

                </View>
              )
            ))}

          </View>
        )}

        {/* PROJECTS */}

        {hasProjects && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>

            {resume.projects.map((project, index) => (
              (project.title || project.description) && (
                <View key={project.id ?? index} style={styles.card}>
                  <Text style={styles.cardTitle}>{project.title}</Text>
                  <Text style={styles.normalText}>{asText(project.description)}</Text>
                </View>
              )
            ))}

          </View>
        )}

        {/* EDUCATION */}

        {hasEducation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>

            {resume.education.map((edu, index) => (
              (edu.college || edu.degree) && (
                <View key={edu.id ?? index} style={styles.card}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.cardTitle}>{edu.degree}</Text>
                      <Text style={styles.cardSubtitle}>{edu.college}</Text>
                    </View>
                    <Text style={styles.cardMeta}>{edu.year}</Text>
                  </View>
                </View>
              )
            ))}

          </View>
        )}

        {/* ACHIEVEMENTS */}

        {hasAchievements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>

            {achievements.map((achievement, index) => (
              <View key={index} style={styles.bulletRow}>
                <Text style={styles.bulletDash}>-</Text>
                <Text style={styles.bulletText}>{getAchievementText(achievement)}</Text>
              </View>
            ))}

          </View>
        )}

      </Page>

    </Document>
  );
}

// ---------------------------------------------------------------------
// GUARANTEED single-page fit
//
// Everything above (estimateDocHeight / pickDensityTier) is a *prediction*
// — a best-effort guess before rendering. Predictions can be wrong, and
// clearly have been. This function replaces guessing with verification:
// it actually renders the PDF, checks the REAL page count with pdf-lib,
// and if it's more than 1 page, re-renders at the next smaller tier and
// checks again — repeating until it either fits on one page or runs out
// of tiers to try. This is slower (each attempt is a full render) but it
// cannot be fooled by a bad estimate, because it isn't estimating.
// ---------------------------------------------------------------------

// Counts pages in a generated PDF blob without any extra dependency.
// react-pdf writes each page as its own PDF object with "/Type /Page"
// (the plural "/Type /Pages" is the page-tree root, not a page itself,
// so it's explicitly excluded). This is a lightweight structural check,
// not a full PDF parser, but it's reliable for documents produced by
// @react-pdf/renderer.
async function countPdfPages(blob) {
  const text = await blob.text();
  const matches = text.match(/\/Type\s*\/Page(?!s)\b/g);
  return matches ? matches.length : 1;
}

export async function generateFittedResumePdf(resume) {
  const { pdf } = await import("@react-pdf/renderer");

  let lastBlob = null;
  let lastTier = null;

  for (const tier of TIER_ORDER) {
    const doc = <ResumeDocument resume={resume} forceTier={tier} />;
    const blob = await pdf(doc).toBlob();
    const pageCount = await countPdfPages(blob);

    lastBlob = blob;
    lastTier = tier;

    if (pageCount <= 1) {
      return { blob, tier, pageCount, fit: true };
    }
  }

  // Every tier down to the smallest ("legal-tight") still produced more
  // than one page — the content genuinely doesn't fit on a single Legal
  // page at readable font sizes. Return the smallest-tier attempt as the
  // best available result rather than shrinking text into illegibility.
  return { blob: lastBlob, tier: lastTier, pageCount: 2, fit: false };
}

export default function ResumePDF({ resume }) {
  const [state, setState] = React.useState({ loading: false, error: null, overflowed: false });

  if (!resume) {
    return null;
  }

  const handleDownload = async () => {
    setState({ loading: true, error: null, overflowed: false });
    try {
      const { blob, fit } = await generateFittedResumePdf(resume);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${resume.title || "resume"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setState({ loading: false, error: null, overflowed: !fit });
    } catch (err) {
      console.error("PDF generation error:", err);
      setState({ loading: false, error: err, overflowed: false });
    }
  };

  return (
    <div>
      <button className="download-btn" onClick={handleDownload} disabled={state.loading}>
        {state.loading ? "Preparing PDF..." : "⬇ Download PDF"}
      </button>
      {state.overflowed && (
        <p style={{ color: "#B91C1C", fontSize: 12, marginTop: 6 }}>
          This resume has more content than can fit on one page even at the
          smallest readable size — it downloaded as 2 pages. Trim some
          bullet points or the summary to force it onto one page.
        </p>
      )}
      {state.error && (
        <p style={{ color: "#B91C1C", fontSize: 12, marginTop: 6 }}>
          Couldn't generate the PDF. Please try again.
        </p>
      )}
    </div>
  );
}
