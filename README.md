# Sistem Manajemen Berita

Wahyu Nur Agustusanto

Sistem Manajemen Berita yang dirancang sebagai bagian dari technical test di PT Rudex Teknologi Indonesia.
Aplikasi ini dibangun menggunakan Node.js dengan arsitektur asynchronous processing untuk mensimulasikan sistem backend skala menengah yang memerlukan pemrosesan data secara efisien dan terpisah.

Sistem ini mengintegrasikan MySQL sebagai database utama untuk penyimpanan data berita, RabbitMQ sebagai message broker untuk menangani proses asynchronous, serta Elasticsearch sebagai search engine untuk kebutuhan pencarian berita.

---

## Cara Clone & Menjalankan Project

### 1. Clone Repository

```bash
git clone https://github.com/Waynra/management-system-news.git
cd management-system-news
```

### 2. Konfigurasi Environment

```bash
cp .env.example .env
```

Contoh isi `.env`:

```env
NODE_ENV=development
PORT=3000

DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=news_db
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_QUEUE=news_queue
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=news
WORKER_PREFETCH=1
```

### 3️. Menjalankan Project (Docker)

```bash
npm run docker:up
```

### 4️. Reset Environment (Opsional – Development)

```bash
npm run docker:reset
```

---

## Arsitektur Sistem

```
Client
  ↓
API Backend (Node.js)
  ↓
MySQL (Database Utama)
  ↓
RabbitMQ (Message Queue)
  ↓
Worker
  ↓
Elasticsearch
```

1. Client mengirim request ke API Backend untuk membuat atau mengambil data berita.

2. API Backend menyimpan data berita ke MySQL sebagai database utama.

3. Setelah data tersimpan, API akan mengirim message ke RabbitMQ untuk diproses secara asynchronous.

4. Worker mengonsumsi message dari RabbitMQ dan melakukan proses indexing data ke Elasticsearch.

5. Untuk kebutuhan pencarian, API akan melakukan query langsung ke Elasticsearch, sedangkan untuk pengambilan data berita menggunakan database utama.

## API Endpoint

### POST /api/news

Menyimpan berita ke database dan mengirim ke RabbitMQ.

### GET /api/news

Mengambil data berita dari database dengan pagination dan filter.

### GET /api/search

Melakukan pencarian berita menggunakan Elasticsearch.

---

## Cara Menguji API

```bash
import file postman collection yang ada pada folder root "sistem-manajemen-berita.postman-collection.json"

atau

via client/frontend http://localhost:5173
```

---

## Available Scripts

```bash
npm run start:api
npm run start:worker
npm run db:migrate
npm run db:seed
npm run docker:up
npm run docker:reset
```

---

## Catatan

- Migration dan seeding hanya dijalankan pada environment non-production.
- Sistem dirancang agar dapat dijalankan dengan satu perintah Docker.
