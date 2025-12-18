# Sistem Manajemen Berita

Proyek backend untuk manajemen berita dengan pemrosesan asynchronous. API menyimpan berita ke MySQL, mengantrikan tugas ke RabbitMQ, lalu worker melakukan indexing ke Elasticsearch untuk pencarian cepat.

## Gambaran Singkat
- REST API untuk membuat, mengambil, dan mencari berita.
- Penyimpanan utama di MySQL; indexing dan pencarian di Elasticsearch.
- RabbitMQ memisahkan proses penulisan dan indexing sehingga API tetap responsif.
- Migrasi dan seeding otomatis saat stack Docker Compose dijalankan.
- Koleksi Postman tersedia di `sistem-manajemen-berita.postman_collection` untuk percobaan cepat.

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
- Port yang digunakan: 3000 (API), 5672 (RabbitMQ), 9200 (Elasticsearch), 3306 (MySQL).
- Untuk menjalankan tanpa Docker: Node.js 18+ dan akses ke MySQL, RabbitMQ, Elasticsearch.

## Konfigurasi Environment
Salin contoh konfigurasi lalu sesuaikan jika perlu:

```bash
cp .env.example .env
```

Nilai standar (sesuai stack Docker):
```env
NODE_ENV=development
BACKEND_PORT=3000
CLIENT_BASE_URL=http://localhost:5173

DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=news_db

RABBITMQ_URL=amqp://rabbitmq
RABBITMQ_QUEUE=news_queue

ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=news

WORKER_PREFETCH=1
```
Jika menjalankan di luar Docker, ganti `mysql`, `rabbitmq`, dan `elasticsearch` menjadi `localhost` atau host masing-masing layanan.

## Jalankan dengan Docker Compose (disarankan)
1) Clone repo:
```bash
git clone https://github.com/Waynra/management-system-news.git
cd management-system-news
```
2) Siapkan `.env` seperti di atas.
3) Bangun dan jalankan seluruh stack:
```bash
npm run docker:up
```
   - Service `migrate` akan melakukan migrasi skema.
   - Service `seed` akan mengisi data contoh dan membuat indeks Elasticsearch.
4) Hentikan dan bersihkan container serta volume:
```bash
npm run docker:reset
```

## Menjalankan Secara Lokal (tanpa Docker)
1) Pastikan MySQL, RabbitMQ, dan Elasticsearch sudah berjalan dan variabel environment sudah diset.
2) Instal dependensi backend:
```bash
cd backend
npm install
```
3) Jalankan migrasi & seeding (hanya untuk non-production):
```bash
npm run db:migrate
npm run db:seed
```
4) Jalankan API dan worker pada terminal terpisah:
```bash
npm run start:api   # menjalankan server REST pada BACKEND_PORT
npm run start:worker
```

## Endpoint API
Semua endpoint diawali dengan prefix `/api`.

- `POST /api/news` — Membuat berita baru, menyimpan ke MySQL, lalu mengantrekan indexing.
  - Body contoh:
    ```json
    {
      "title": "Judul Berita",
      "content": "Isi berita minimal 10 karakter",
      "author": "Penulis",
      "source": "Sumber"
    }
    ```
- `GET /api/news?page=1&limit=10` — Mengambil daftar berita dari MySQL dengan pagination.
- `GET /api/search?query=kata` — Mencari berita dari Elasticsearch (multi-field, fuzziness aktif).

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

## Pengujian API
- Import koleksi Postman: `sistem-manajemen-berita.postman_collection`.
- Atau gunakan client/frontend di `http://localhost:5173` bila tersedia.

## Script yang Tersedia
- Root:
  - `npm run docker:up` — Build & jalankan seluruh stack Docker Compose.
  - `npm run docker:reset` — Matikan stack dan hapus volume.
- Backend:
  - `npm run start:api` — Menjalankan API server.
  - `npm run start:worker` — Menjalankan worker RabbitMQ → Elasticsearch.
  - `npm run db:migrate` — Migrasi skema database (skip pada production).
  - `npm run db:seed` — Seed data contoh dan indeks Elasticsearch (skip pada production).

## Catatan & Tips
- Proses indexing bersifat asynchronous; data baru muncul di pencarian setelah worker memproses antrean.
- Jika terjadi inkonsistensi indeks, jalankan ulang `npm run db:seed` (non-production) atau reindeks sesuai kebutuhan.
- Simpan kredensial sensitif di `.env` dan jangan commit file tersebut.
