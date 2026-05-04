# hmmm. by PB — formulářová aplikace

Klientský brief formulář pro **Hmmm by PB Private Dining**. Klient vyplní → PDF se vygeneruje → mail Petrovi + klientovi.

## Co to umí

- **Onboarding-style formulář** v Hmmm by PB designu (paper, ink, serif, drill-downy, slidery)
- **15-krokový flow** pro klienta (jméno → kde → rytmus dne → vibe → strava → chutě → kuchyně → omezení → pití → atmosféra → rozpočet → speciální → potvrzení → odesláno)
- **PDF generátor** — z dat udělá A4 brief v brand stylu (paper background, ink typography, hmmm. logo)
- **Dva e-maily na jedno odeslání**:
  - Petrovi: brief PDF v příloze + HTML rekapitulace s alergiemi v rust červené
  - Klientovi: poděkování + stejný PDF v příloze
- **Internal log + Recipe builder** módy v UI (tlačítka nahoře) — zatím jen prototyp, neukládají

## Co potřebuješ k nasazení (15 minut)

1. **Účet na Vercel** — zdarma, github sign-in
2. **Účet na Resend** — zdarma do 3 000 mailů/měs, github sign-in
3. **Github účet** — kam nahraješ tenhle kód

---

## Krok 1: Github

1. Vytvoř si nový repository na github.com (např. `hmmm-form`). Public nebo private, jedno.
2. Stáhni si `hmmm-app.zip` který ti posílám.
3. Rozbal ho. Otevři terminál v rozbalené složce a pusť:
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/TVOJE-JMENO/hmmm-form.git
   git push -u origin main
   ```
   *(Jestli neumíš git, můžeš taky soubory nahrát přes github web UI: "Add file → Upload files".)*

---

## Krok 2: Resend (mailing)

1. Jdi na https://resend.com, sign up s github účtem.
2. V dashboardu klikni **API Keys** → **Create API Key**.
3. Pojmenuj ho `hmmm-form` a dej **Sending access**. Zkopíruj klíč (`re_xxxxx...`) — **ihned, už ti ho neukáže**.
4. **Domain (volitelné, ale doporučeno):**
   - Bez vlastní domény můžeš posílat z `onboarding@resend.dev` — funguje hned, ale klient v inboxu uvidí "via resend.dev".
   - S vlastní doménou (např. `pb-dining.com`): v Resend → **Domains** → **Add Domain** → zadej doménu → zkopíruj DNS záznamy (TXT, MX) → vlož je u svého doménového registrátora. Verify (do 10 minut). Pak můžeš posílat z `hello@pb-dining.com`.

---

## Krok 3: Vercel deploy

1. Jdi na https://vercel.com, sign up s github účtem.
2. Klikni **Add New Project** → **Import** → vyber `hmmm-form` repo z github.
3. Vercel detekuje Next.js automaticky. **Nepouštěj deploy hned** — nejdřív nastav environment variables.
4. Sjeď dolů na **Environment Variables** a přidej tři:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | tvůj klíč z Resend, `re_xxxxx...` |
   | `PETR_EMAIL` | mail Petra, kam mají chodit briefy |
   | `MAIL_FROM` | `Hmmm by PB <onboarding@resend.dev>` *(nebo `<hello@pb-dining.com>` pokud máš ověřenou doménu)* |

5. Klikni **Deploy**. Po ~2 minutách máš live URL typu `hmmm-form-xxx.vercel.app`.

---

## Krok 4: Test

1. Otevři tu URL v prohlížeči.
2. Klikni **Začít** → vyplň pár polí → projdi až na krok 13 → odklikni potvrzovací checkbox → **Odeslat Petrovi**.
3. Zkontroluj inbox (Petrův i klientův). Měli by tam dorazit oba maily s PDF.

**Pokud něco nedorazí:**
- Mrkni na Vercel → tvůj projekt → **Logs** → najdi `submit error` log
- Mrkni v Resend → **Logs** → uvidíš jestli mail odešel a kam

---

## Vlastní doména

Pokud chceš místo `hmmm-form-xxx.vercel.app` třeba `tvujvecer.pb-dining.com`:

1. Vercel → tvůj projekt → **Settings** → **Domains** → **Add** → zadej subdoménu
2. Vercel ti dá CNAME záznam — vlož ho u registrátora pb-dining.com
3. Za pár minut funguje

---

## Posílání klientům

Stačí poslat URL přes WhatsApp, mail, IG DM:

> Ahoj, mrkni — vyplň mi tohle a dám se ti vědět:
> https://tvujvecer.pb-dining.com

Funguje na mobilu i desktopu.

---

## Co až budeš chtít rozšířit

- **Internal log režim** (záznam po večeru) — UI je hotový, stačí zapojit `/api/submit` jako u klienta a uložit do databáze (Vercel KV, Supabase, nebo Airtable)
- **Recipe builder** (kuchařka) — totéž, plus foto upload na Vercel Blob storage nebo Cloudinary
- **Auto export do Google Drive** — Zapier integrace na Resend webhook → kopie PDF do tvojí složky
- **Statistiky po 10 záznamech** — průměrná marže, nejziskovější typ akce

To už jsou další iterace. Tahle V1 je úzce zaměřená: klient vyplní → ty máš v mailu kompletní brief.

---

## Soubory

```
app/
  layout.tsx              kořenový layout
  page.tsx                stránka — serve formuláře
  api/
    submit/route.tsx      POST endpoint, generuje PDF + posílá maily
    preview-pdf/route.tsx GET endpoint, ukázkový PDF (smaž v produkci nebo nech, je read-only)
lib/
  pdf.tsx                 React PDF generátor
public/
  index.html              HTML formulář (vlastní logika a styly)
  hmmm_logo.png           logo
  fonts/                  TTF fonty (Liberation Serif s českou diakritikou)
.env.example              vzor env proměnných
package.json
next.config.js
tsconfig.json
```

## Editace formuláře

Když chceš upravit otázky / texty / vzhled, edituj `public/index.html`. Je to jeden soubor, vše inline.

Když chceš upravit PDF design, edituj `lib/pdf.tsx`.

Po úpravě commitni a pushni do github — Vercel se sám rebuildne (do 2 minut).

---

## Otázky a odpovědi

**Q: Kolik mě to měsíčně stojí?**
A: Vercel Hobby plan zdarma (do 100 GB traffic). Resend zdarma (do 3 000 mailů/měs = ~100 odeslaných briefů/měs ze strany klienta + 100 confirmation mailů). Doména pb-dining.com je samostatně cca 250 Kč/rok.

**Q: Klient musí instalovat něco?**
A: Ne. Funguje v každém moderním prohlížeči (Safari, Chrome, Firefox) na mobilu i desktopu.

**Q: Co když klient zavře tab v půlce?**
A: Data se nikam neukládají automaticky (zatím). Musí začít znovu. Pokud to bude problém, dá se přidat localStorage save/restore.

**Q: Můžu mít víc různých formulářů?**
A: Tak, jak je to teď, ne. Ale dá se snadno rozšířit — třeba každý má vlastní URL `/svatba`, `/firemni-akce`, `/narozeniny` s pre-vyplněnými defaulty.

---

*Vytvořeno pro Petra Bínu (Hmmm by PB) — květen 2026.*
