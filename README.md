# TikTok Downloader

TikTok Downloader adalah utilitas Node.js yang dirancang untuk mengunduh video dan slideshow foto dari TikTok secara cepat dan efisien. Utilitas ini memanfaatkan layanan SnapTik sebagai backend, namun telah dioptimalkan untuk menghindari iklan ( HD Version ) dan mempercepat proses pengunduhan.

## Fitur Utama

- Mengunduh video TikTok dalam kualitas HD tanpa iklan.
- Mengunduh slideshow foto dari postingan TikTok.
- Proses pengunduhan yang cepat dan efisien.
- Antarmuka baris perintah yang sederhana dan mudah digunakan.
- Mendukung pengunduhan ulang otomatis jika terjadi kegagalan.

## Persyaratan

- Node.js (versi 12 atau lebih baru)
- npm (Node Package Manager)

## Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/fleurdefontaine/snaptik-api.git
   ```

2. Masuk ke direktori proyek:
   ```bash
   cd snaptik-api
   ```

3. Install dependensi yang diperlukan:
   ```bash
   npm i
   ```

## Penggunaan

1. Jalankan utilitas:
   ```bash
   node index.js
   ```

2. Masukkan URL TikTok yang ingin diunduh ketika diminta.

3. Jika kontennya berupa slideshow, Anda akan diminta untuk memasukkan jumlah foto yang ingin diunduh.

4. Tunggu hingga proses pengunduhan selesai. File yang diunduh akan disimpan dalam folder 'downloads'.
