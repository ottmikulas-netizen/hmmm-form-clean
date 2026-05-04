import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  pdf,
} from "@react-pdf/renderer";
import React from "react";
import fs from "fs";
import path from "path";

// Load fonts from local files. Liberation Serif has full Czech diacritic support.
// (Cormorant Garamond would need to be bundled — we'd ship a TTF in public/fonts;
// here we use system Liberation as the v1 font. User can swap in Cormorant by
// dropping CormorantGaramond-Regular.ttf into public/fonts and renaming below.)
function loadFont(name: string): string | null {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), "public", "fonts", name));
    return `data:font/ttf;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const serifReg = loadFont("serif-regular.ttf");
const serifIt = loadFont("serif-italic.ttf");
const sansReg = loadFont("sans-regular.ttf");

if (serifReg && serifIt) {
  Font.register({
    family: "Serif",
    fonts: [
      { src: serifReg, fontWeight: "normal" },
      { src: serifIt, fontWeight: "normal", fontStyle: "italic" },
    ],
  });
}
if (sansReg) {
  Font.register({
    family: "Sans",
    fonts: [{ src: sansReg, fontWeight: "normal" }],
  });
}

// Disable hyphenation (we don't want Czech words split)
Font.registerHyphenationCallback((word) => [word]);

const PAPER = "#EDE7D9";
const INK = "#1A1A1A";
const GREY = "#968E7E";
const HAIR = "#C8BFA9";
const RUST = "#B6553A";

const styles = StyleSheet.create({
  page: {
    backgroundColor: PAPER,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 56,
    fontFamily: "Serif",
    fontSize: 10,
    color: INK,
  },
  logo: { width: 100, marginBottom: 22 },
  title: {
    fontSize: 22,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 9,
    fontFamily: "Sans",
    color: GREY,
    letterSpacing: 1.5,
    marginBottom: 18,
    textTransform: "lowercase",
  },
  intro: {
    fontFamily: "Serif",
    fontStyle: "italic",
    fontSize: 11,
    color: INK,
    marginBottom: 22,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 14,
  },
  sectionDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: HAIR,
    marginBottom: 10,
  },
  sectionNum: {
    fontFamily: "Sans",
    fontSize: 7.5,
    color: GREY,
    letterSpacing: 2,
    marginBottom: 3,
  },
  sectionTitle: {
    fontFamily: "Sans",
    fontSize: 8.5,
    color: INK,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  fieldRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "baseline",
  },
  fieldLabel: {
    fontFamily: "Sans",
    fontSize: 8.5,
    color: GREY,
    width: 130,
    textTransform: "lowercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: "Serif",
    fontSize: 11,
    color: INK,
    flex: 1,
  },
  fieldValueEmpty: {
    fontFamily: "Serif",
    fontSize: 10,
    fontStyle: "italic",
    color: HAIR,
    flex: 1,
  },
  alergieBox: {
    backgroundColor: PAPER,
    borderLeftWidth: 2,
    borderLeftColor: RUST,
    paddingLeft: 12,
    paddingVertical: 6,
    marginVertical: 4,
  },
  closing: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 0.5,
    borderTopColor: HAIR,
    fontFamily: "Serif",
    fontStyle: "italic",
    fontSize: 10,
    color: INK,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Sans",
    fontSize: 7.5,
    color: GREY,
    letterSpacing: 1.2,
  },
});

// Helper to render value or em-dash if empty
function val(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length > 0 ? v.join(", ") : "—";
  return String(v);
}

function Field({ label, value }: { label: string; value: any }) {
  const v = val(value);
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={v === "—" ? styles.fieldValueEmpty : styles.fieldValue}>
        {v}
      </Text>
    </View>
  );
}

function Section({
  num,
  title,
  children,
  alert,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionNum}>{num}</Text>
      <Text style={[styles.sectionTitle, alert ? { color: RUST } : {}]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export type SubmissionData = {
  jmeno?: string;
  telefon?: string;
  email?: string;
  mesto?: string;
  prostor?: string;
  hostu?: string | number;
  datum?: string;
  prijezd?: string;
  start?: string;
  prvnichod?: string;
  tempo?: string;
  vibe?: string;
  stravaMain?: string[];
  meatTypes?: string[];
  fishTypes?: string[];
  chute?: string[];
  kuchyne?: string[];
  bbqStyle?: string[];
  asiaStyle?: string[];
  alergie?: string;
  nechci?: string;
  dieta?: string;
  pairingMain?: string[];
  shots?: string[];
  napojePref?: string;
  atmosfera?: string[];
  rolepetra?: string;
  rozpocet?: string | number;
  rozpocetText?: string;
  occasion?: string[];
  extra?: string;
  submittedAt?: string;
};

export function HmmmFormPDF({
  data,
  logoBase64,
}: {
  data: SubmissionData;
  logoBase64: string;
}) {
  const dateStr = data.submittedAt
    ? new Date(data.submittedAt).toLocaleDateString("cs-CZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <Document
      title={`Hmmm by PB — ${data.jmeno || "Klient"}`}
      author="hmmm. by PB"
    >
      <Page size="A4" style={styles.page}>
        {logoBase64 ? (
          <Image style={styles.logo} src={logoBase64} />
        ) : null}

        <Text style={styles.title}>Tvůj večer s Petrem</Text>
        <Text style={styles.subtitle}>brief od klienta</Text>

        <Text style={styles.intro}>
          Pojďme spolu vytvořit večer, na který se nezapomíná.
        </Text>

        <Section num="01" title="O Tobě">
          <Field label="jméno" value={data.jmeno} />
          <Field label="telefon" value={data.telefon} />
          <Field label="e-mail" value={data.email} />
        </Section>

        <Section num="02" title="Kde a pro koho">
          <Field label="město / adresa" value={data.mesto} />
          <Field label="typ prostoru" value={data.prostor} />
          <Field label="počet hostů" value={data.hostu} />
        </Section>

        <Section num="03" title="Rytmus dne">
          <Field label="datum" value={data.datum} />
          <Field label="příjezd Petra" value={data.prijezd} />
          <Field label="aperitiv / start" value={data.start} />
          <Field label="první chod" value={data.prvnichod} />
          <Field label="poznámka k tempu" value={data.tempo} />
        </Section>

        <Section num="04" title="Vibe">
          <Field label="charakter večera" value={data.vibe} />
        </Section>

        <Section num="05" title="Strava">
          <Field label="hlavní volby" value={data.stravaMain} />
          <Field label="druhy masa" value={data.meatTypes} />
          <Field label="ryby & seafood" value={data.fishTypes} />
        </Section>

        <Section num="06" title="Chutě">
          <Field label="oblíbené chutě" value={data.chute} />
        </Section>

        <Section num="07" title="Kuchyně světa">
          <Field label="regiony" value={data.kuchyne} />
          <Field label="BBQ styl" value={data.bbqStyle} />
          <Field label="Asie detail" value={data.asiaStyle} />
        </Section>

        <Section num="08" title="Omezení — pozor" alert>
          <Field label="alergie" value={data.alergie} />
          <Field label="co fakt nechce jíst" value={data.nechci} />
          <Field label="dieta" value={data.dieta} />
        </Section>

        <Section num="09" title="Pití">
          <Field label="pairing s jídlem" value={data.pairingMain} />
          <Field label="panáky mezi chody" value={data.shots} />
          <Field label="preference / oblíbené" value={data.napojePref} />
        </Section>

        <Section num="10" title="Atmosféra">
          <Field label="charakter večera" value={data.atmosfera} />
          <Field label="role Petra" value={data.rolepetra} />
        </Section>

        <Section num="11" title="Rozpočet">
          <Field label="slider (€/os)" value={data.rozpocet} />
          <Field label="vlastní představa" value={data.rozpocetText} />
        </Section>

        <Section num="12" title="Speciální">
          <Field label="příležitost" value={data.occasion} />
          <Field label="přání / poznámka" value={data.extra} />
        </Section>

        <Text style={styles.closing}>
          Klient potvrdil pravdivost alergií a omezení. Petr ti zavolá do 24 hodin a doladí detaily.
        </Text>

        <View style={styles.footer} fixed>
          <Text>hmmm. by PB · private dining</Text>
          <Text>{dateStr}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPdfBuffer(
  data: SubmissionData,
  logoBase64: string
): Promise<Buffer> {
  const stream = await pdf(
    <HmmmFormPDF data={data} logoBase64={logoBase64} />
  ).toBuffer();
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
