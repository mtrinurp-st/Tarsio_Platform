# Tarsio — Growth platform

Revamp inkremental platform self-development ID/EN dengan Tarsy, 71 quest singkat, Gemini, CMS, musik dan gamification. Status implementasi dan batas pengujian ada di [Release status](docs/RELEASE-STATUS.md). PRD konsolidasi dan prompt akhir ada di [PRD Master 1.5](docs/PRD-MASTER-1.5.md).

## Menjalankan

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Isi hanya URL dan publishable/anon key Supabase pada variabel `VITE_SUPABASE_*`. Tanpa konfigurasi, progres dan CMS berjalan dalam mode perangkat; chat Gemini memerlukan endpoint server aktif. Data perangkat tidak otomatis diunggah ketika login.

## Backend

Proyek aktif: `vbyjijxfixwrprwkeyom`. Terapkan migrasi berurutan menggunakan Supabase CLI pada lingkungan yang sesuai. Jangan menjalankan SQL konseptual PRD langsung pada produksi atau menimpa migrasi lama.

Deploy `supabase/functions/chat-reply/index.ts` dan `supabase/functions/quest-result/index.ts`, termasuk `_shared/tarsy.ts`. Kedua endpoint menerima chat guest tanpa JWT, memvalidasi payload, dan tidak membaca jurnal pribadi. Set `GEMINI_API_KEY` sebagai Edge secret atau gunakan Vault bernama `tarsio_gemini_api_key` melalui bridge service-only pada migrasi. Default model `gemini-3.6-flash`; optional override server `GEMINI_MODEL`. Jangan menaruh secret pada `VITE_*`, source, logs, atau Git.

Konfigurasikan Auth Site URL, redirect deployment dan SMTP. Form login, signup, reset dan recovery tersedia, tetapi pengiriman email nyata harus diuji dengan konfigurasi proyek. Admin CMS ditetapkan melalui kanal server tepercaya, tidak dari metadata signup. Pembayaran belum diaktifkan.

## Produk

- 3–6 pertanyaan opsi + satu essay akhir per quest; insight Gemini memakai jawaban quest saat ini saja.
- Chat sesi dengan persona hangat dan objektif, kirim/batal/retry, kontras terang/gelap, tanpa dead-end hubungkan akun.
- Tur Tarsy lima langkah, katalog 12 skin/aksesori dengan pilihan gratis dan Circle Pass, onboarding, panduan, ID/EN, empat palet, reduced motion dan reaksi Tarsy.
- Musik asli The Gentle Climb dengan on/off, volume, pause saat tab tersembunyi.
- XP/reward idempoten, streak, misi, squad, kudos, liga opt-in dan Best Friend maksimal lima dan Fire Circle mutual tiga hari.
- CMS bilingual dengan validasi publish/revisi dan UGC yang harus ditinjau admin sebelum publikasi.
- Draft lama, ekspor pribadi dan histori tetap dipertahankan. Database/RLS melindungi jurnal, bukan end-to-end encryption.

## Verifikasi

```sh
npm test
npm run typecheck
npm run lint
npm run build
```

Tes PostgreSQL memakai PGlite dan emulasi `auth.uid()`, mencakup migrasi, 71 quest, reward, role, privasi, CMS, UGC dan Fire. Tes provider memakai mock; hasil Gemini live dan browser dicatat terpisah pada release status. Tidak menggantikan uji SMTP, dua akun browser, load atau audit aksesibilitas lengkap.

Untuk menghasilkan seed tambahan, gunakan `npm run seed:generate -- /path/to/NEW_migration.sql`. Generator menolak path yang sudah ada; jangan menulis ulang migrasi yang telah diterapkan. CMS online mengambil prioritas atas katalog bawaan.

Monetisasi: integrasi Midtrans Snap dan webhook tersedia namun penjualan belum diaktifkan. Ikuti [runbook](docs/BILLING-RUNBOOK.md) untuk konfigurasi merchant dan uji sandbox; pembayaran tidak diakui sukses dari callback browser.

Musik asli direkonstruksi dari `src/assets/music/*.b64` saat npm install/build dan diverifikasi SHA-256. File MP3 hasil build tidak perlu di-commit.

## Vercel

`vercel.json` sudah menyiapkan deployment untuk SPA Vite yang sama. Import repository ini di Vercel dengan preset **Vite** (Build Command `npm run build`, Output Directory `dist`; nilai tersebut sudah ada di file konfigurasi), lalu tambahkan dua variabel publik berikut pada semua environment yang dipakai:

```text
VITE_SUPABASE_URL=https://vbyjijxfixwrprwkeyom.supabase.co
VITE_SUPABASE_ANON_KEY=<Supabase publishable/anon key>
```

Vercel hanya menjadi host frontend. Auth, Gemini, CMS, database, dan webhook Midtrans tetap berjalan di Supabase Edge Functions. Setelah mendapat domain Vercel, tambahkan domain tersebut ke Supabase Authentication → URL Configuration → Site URL dan Redirect URLs. Jangan memasukkan `GEMINI_API_KEY`, Midtrans Server Key, `SUPABASE_SERVICE_ROLE_KEY`, atau nilai Vault ke Vercel maupun Git.
