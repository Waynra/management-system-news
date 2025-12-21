# Sistem Manajemen Berita

Backend untuk manajemen berita dengan pemrosesan asynchronous. API menulis ke MySQL, mengantrikan pekerjaan ke RabbitMQ, lalu worker mengindeks ke Elasticsearch untuk pencarian cepat. test case PT Rudex Teknologi Indonesia

## Gambaran Singkat
- REST API untuk membuat, mengambil, dan mencari berita.
- MySQL sebagai storage utama; Elasticsearch untuk pencarian.
- RabbitMQ memisahkan penulisan dan indexing agar API tetap responsif.
- Migrasi dan seeding otomatis saat stack Docker Compose dijalankan.
- Koleksi Postman tersedia di `management-system-news.postman_collection` (bisa diimport ke Thunder Client/Postman Web).

## Arsitektur
```
Client
  |
  |  REST API (Express)
  v
MySQL <---------------------------+
  |                               |
  | kirim tugas index             |
  v                               |
RabbitMQ Queue                    |
  |                               |
  v                               |
Worker (Node.js)                  |
  |                               |
  +----------> Elasticsearch <----+
                |   ^
                |   |
           Query Search
```

## Prasyarat
- Docker & Docker Compose.
- Port: 3000 (API), 5672 (RabbitMQ), 9200 (Elasticsearch), 3306 (MySQL).
- Jika tanpa Docker: Node.js 18+, akses ke MySQL, RabbitMQ, Elasticsearch.

## Konfigurasi Environment
Salin konfigurasi lalu sesuaikan:
```bash
cp .env.example .env
```

Nilai standar (sesuai Docker Compose):
```env
NODE_ENV=development
PORT=3000
CLIENT_BASE_URL=*

DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=news_db

RABBITMQ_URL=amqp://rabbitmq
RABBITMQ_QUEUE=news_queue
RABBITMQ_MAX_RETRY=5
RABBITMQ_RETRY_DELAY_MS=2000

ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=news

WORKER_PREFETCH=1
WORKER_MAX_RETRY=3
WORKER_RETRY_DELAY_MS=2000
```
Jika menjalankan di luar Docker, ganti `db`, `rabbitmq`, dan `elasticsearch` menjadi `localhost` atau host masing-masing layanan.

## Jalankan dengan Docker Compose (disarankan)
1) Siapkan `.env` seperti di atas.
2) Bangun dan jalankan stack:
```bash
npm run docker:up
```
   - Container API menjalankan migrasi dan seeding otomatis (non-production).
   - Worker berjalan dari image yang sama (`news-backend`) dengan perintah `npm run start:worker`.
3) Hentikan dan bersihkan container serta volume:
```bash
npm run docker:reset
```

## Menjalankan Secara Lokal (tanpa Docker)
1) Pastikan MySQL, RabbitMQ, Elasticsearch aktif dan env sudah diset.
2) Instal dependensi:
```bash
cd api
npm install
```
3) Migrasi dan seeding (non-production):
```bash
npm run db:migrate
npm run db:seed
```
4) Jalankan layanan di dua terminal:
```bash
npm run start:api   # REST server pada PORT
npm run start:worker
```

## Endpoint API
Prefix: `/api`.

- `POST /api/news` — Simpan berita ke MySQL dan antrekan indexing.
  - Body contoh:
    ```json
    {
      "title": "Judul Berita",
      "content": "Isi berita minimal 10 karakter",
      "author": "Penulis",
      "source": "Sumber"
    }
    ```
- `GET /api/news?page=1&limit=10` — Ambil daftar berita dengan pagination.
- `GET /api/search?query=kata` — Cari berita dari Elasticsearch (multi-field, fuzziness).

Contoh cURL:
```bash
# Buat berita
curl -X POST http://localhost:3000/api/news \
  -H "Content-Type: application/json" \
  -d '{ "title": "Harga BBM Naik", "content": "Pemerintah resmi menaikkan harga.", "author": "Redaksi", "source": "twitter" }'

# Ambil berita
curl "http://localhost:3000/api/news?page=1&limit=5"

# Cari berita
curl "http://localhost:3000/api/search?query=bbm"
```

## Pengujian dengan Postman/Thunder Client
- Import `management-system-news.postman_collection`.
  - Postman Web: Import -> File -> pilih file.
  - Thunder Client: Sidebar petir -> Collections -> ... -> Import -> pilih file.
- Jalankan urutan Add -> List -> Search. Beri jeda beberapa detik agar worker selesai indexing sebelum mencari.

## Script yang Tersedia
- Root:
  - `npm run docker:up` — Build & jalankan stack Docker Compose.
  - `npm run docker:reset` — Matikan stack dan hapus volume.
- Backend (folder `api`):
  - `npm run start:api` — Menjalankan API server.
  - `npm run start:worker` — Menjalankan worker RabbitMQ -> Elasticsearch.
  - `npm run db:migrate` — Migrasi skema database (skip pada production).
  - `npm run db:seed` — Seed data contoh dan indeks Elasticsearch (skip pada production).

## Catatan & Troubleshooting
- Indexing asynchronous: data baru muncul di pencarian setelah worker memproses antrean.
- Worker: idempotent (dokumen ES memakai id berita) dan akan retry terbatas dengan backoff; jika koneksi RabbitMQ putus, consumer akan mencoba restart otomatis.
- Cek log: `docker compose logs -f api` (API/migrasi/seed), `docker compose logs -f worker` (indexing).
- Cek indeks Elasticsearch: `curl http://localhost:9200/_cat/indices` harus menampilkan indeks `news` dengan jumlah dokumen > 0 setelah seeding atau worker jalan.
- Jika pencarian kosong, tunggu beberapa detik lalu coba lagi; bila masih kosong, pastikan worker tidak error dan queue tidak menumpuk.
