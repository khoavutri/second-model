# WebGL Three.js Model Viewer

⚡️ Dự án mẫu sử dụng **Three.js** để hiển thị mô hình 3D GLB, cấu hình sẵn Webpack cho phát triển hiện đại với TypeScript.

---

## ✨ Tính năng

- Hiển thị mô hình 3D (GLB/GLTF) với **Three.js**
- Tích hợp **DRACOLoader** để giải nén mesh nén Draco
- Điều khiển góc nhìn với **OrbitControls**
- Cấu hình Webpack 5 tối ưu cho TypeScript
- Hỗ trợ import asset: hình ảnh, mô hình, shader
- Dev server tự động reload, mở trình duyệt
- Tối ưu build: minify, clean dist, copy public assets

---

## 🚀 Cài đặt & chạy thử

Clone dự án và cài đặt dependencies:

```bash
git clone https://github.com/khoavutri/first-model.git
cd first-model
npm install
```

Chạy dev server:

```bash
npm start
```

Build production:

```bash
npm run build:prod
```

---

## 📁 Cấu trúc thư mục

- `src/` - Mã nguồn TypeScript, khởi tạo scene Three.js tại [`src/index.ts`](src/index.ts)
- `public/` - Asset tĩnh (ảnh, mô hình 3D)
- `dist/` - Thư mục build output
- `webpack.config.js` - Cấu hình Webpack
- `index.html` - File HTML chính

---

## 📝 License

Phần mềm chỉ dành cho mục đích giáo dục, phi thương mại. Xem chi tiết tại [`LICENSE`](LICENSE).

---

## 📬 Liên hệ

Tác giả: Vu Tri Khoa  
Email: khoavutri@gmail.com