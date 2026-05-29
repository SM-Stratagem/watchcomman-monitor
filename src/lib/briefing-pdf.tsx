// Server-side PDF brief generator using @react-pdf/renderer.
// Pure JS, works on Railway without puppeteer.

import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { NewsRow, SignalRow } from "./dashboard";
import type { AiBrief } from "./ai";
import type { SanctionsDelta } from "./sanctions-diff";
import type { CyberPanelData } from "./cyber";
import type { ChokepointStatus } from "./maritime";

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", color: "#111", padding: 36, fontSize: 9.5, fontFamily: "Helvetica" },
  header: { borderBottom: "2pt solid #111", paddingBottom: 10, marginBottom: 16 },
  hLabel: { fontSize: 8, letterSpacing: 2, color: "#777" },
  hTitle: { fontSize: 22, fontWeight: 600, marginTop: 4 },
  hMeta: { fontSize: 9, color: "#555", marginTop: 6 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", borderBottom: "1pt solid #ddd", paddingBottom: 3 },
  bullet: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.45 },
  row: { flexDirection: "row", paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  rowLeft: { width: 130, fontWeight: 600 },
  rowMid: { width: 60, color: "#777", fontSize: 9 },
  rowRight: { flex: 1, color: "#444", fontSize: 10 },
  summaryRow: { flexDirection: "row", paddingVertical: 3 },
  summaryLabel: { flex: 1 },
  summaryVal: { width: 60, textAlign: "right", fontWeight: 600 },
  newsItem: { paddingVertical: 3, borderBottom: "0.5pt solid #eee" },
  newsSource: { fontSize: 8, color: "#888", marginBottom: 1 },
  newsTitle: { fontSize: 9.5, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 28, left: 36, right: 36, borderTop: "1pt solid #ddd", paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#888" },
});

export type BriefingPdfInput = {
  brief: AiBrief;
  signals: SignalRow[];
  news: NewsRow[];
  sanctions: SanctionsDelta | null;
  cyber: CyberPanelData | null;
  chokepoints: ChokepointStatus[];
  date: Date;
  scope?: { theater?: string | null; watchlist?: string[] };
};

function BriefingDoc({ brief, signals, news, sanctions, cyber, chokepoints, date, scope }: BriefingPdfInput) {
  const ymd = date.toISOString().slice(0, 16).replace("T", " ");
  const title = scope?.theater
    ? `Theater Brief — ${scope.theater}`
    : scope?.watchlist?.length
    ? `Watchlist — ${scope.watchlist.join(", ")}`
    : "Global Situation Report";

  const sanctionsAdded24h = sanctions ? Object.values(sanctions.totals).reduce((a, t) => a + t.added24h, 0) : 0;
  const cyberCritical7d = cyber?.totals.critical7d ?? 0;
  const highRiskChokes = chokepoints.filter((c) => c.risk !== "low").slice(0, 6);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.hLabel}>WATCHCOMMAN MONITOR · BRIEFING</Text>
          <Text style={styles.hTitle}>{title}</Text>
          <Text style={styles.hMeta}>{ymd} UTC · {news.length} news · {signals.length} active signals · {brief.credibility?.confidence?.toUpperCase()} CONFIDENCE</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{brief.headline}</Text>
          {brief.bullets.map((b, i) => (
            <View key={i} style={styles.bullet}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
          {brief.credibility && (
            <Text style={{ fontSize: 8, color: "#888", marginTop: 6 }}>
              {brief.credibility.sourcesAnalyzed} sources analysed · {brief.credibility.independentSources} independent{brief.credibility.stateMediaSources > 0 ? ` · ${brief.credibility.stateMediaSources} state-media` : ""} · Model: {brief.model ?? "fallback"}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Strategic Posture</Text>
          {brief.theaters.map((t) => (
            <View key={t.name} style={styles.row}>
              <Text style={styles.rowLeft}>{t.name}</Text>
              <Text style={styles.rowMid}>{t.level}</Text>
              <Text style={styles.rowRight}>{t.note}</Text>
            </View>
          ))}
        </View>

        {highRiskChokes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maritime Chokepoints — Elevated+</Text>
            {highRiskChokes.map((c) => (
              <View key={c.slug} style={styles.row}>
                <Text style={styles.rowLeft}>{c.name}</Text>
                <Text style={[styles.rowMid, { color: "#a23" }]}>{c.risk.toUpperCase()}</Text>
                <Text style={styles.rowRight}>{c.topHeadline ?? `${c.mentionsLast48h} mentions / 48h`}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 24h · Roll-up</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Active signals</Text><Text style={styles.summaryVal}>{signals.length}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>High / critical signals</Text><Text style={styles.summaryVal}>{signals.filter((s) => s.severity === "high" || s.severity === "critical").length}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>New sanctions designations</Text><Text style={styles.summaryVal}>{sanctionsAdded24h}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Critical cyber advisories (7d)</Text><Text style={styles.summaryVal}>{cyberCritical7d}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>News items (24h)</Text><Text style={styles.summaryVal}>{news.length}</Text></View>
        </View>

        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>News Highlights — Top {Math.min(40, news.length)}</Text>
          {news.slice(0, 40).map((n) => (
            <View key={n.id} style={styles.newsItem}>
              <Text style={styles.newsSource}>{n.sourceName} · {new Date(n.publishedAt).toISOString().slice(0, 16).replace("T", " ")} UTC</Text>
              <Text style={styles.newsTitle}>{n.title}</Text>
            </View>
          ))}
        </View>

        {signals.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Active Signals — Top {Math.min(30, signals.length)}</Text>
            {signals.slice(0, 30).map((s) => (
              <View key={s.id} style={styles.newsItem}>
                <Text style={styles.newsSource}>[{s.severity.toUpperCase()}] {s.source} · {s.country ?? s.region ?? "Global"}</Text>
                <Text style={styles.newsTitle}>{s.title}</Text>
              </View>
            ))}
          </View>
        )}

        {sanctions && sanctions.added.length > 0 && (
          <View style={styles.section} break>
            <Text style={styles.sectionTitle}>Sanctions Designations — Last 24h</Text>
            {sanctions.added.slice(0, 30).map((r) => (
              <View key={r.externalKey} style={styles.newsItem}>
                <Text style={styles.newsSource}>{r.jurisdiction.toUpperCase()} {r.listName}{r.program ? ` · ${r.program}` : ""}{r.addressCountry ? ` · ${r.addressCountry}` : ""}</Text>
                <Text style={styles.newsTitle}>{r.entityName}</Text>
              </View>
            ))}
          </View>
        )}

        {cyber && cyber.recent.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cyber Threat Intel — Recent</Text>
            {cyber.recent.slice(0, 15).map((c) => (
              <View key={c.externalKey} style={styles.newsItem}>
                <Text style={styles.newsSource}>{c.source.toUpperCase()}{c.cve ? ` · ${c.cve}` : ""}{c.cvss ? ` · CVSS ${Number(c.cvss).toFixed(1)}` : ""}{c.severity ? ` · ${c.severity.toUpperCase()}` : ""}</Text>
                <Text style={styles.newsTitle}>{c.title}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>watchcomman-monitor · monitor-info.app</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages} · UNCLASSIFIED · FOR ANALYST USE`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderBriefingPdf(input: BriefingPdfInput): Promise<Buffer> {
  return await renderToBuffer(<BriefingDoc {...input} />);
}
