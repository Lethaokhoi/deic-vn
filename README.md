# DEIC — trang tin câu lạc bộ

Trang tin [deic.vn](https://deic.vn) của CLB Trí thức và Doanh nhân Đô Lương tại Hà Nội. Trang chạy trên Cloudflare Pages, không cần thuê máy chủ. Tài khoản doanh nghiệp và bài họ viết được lưu trên Cloudflare D1; ảnh tải lên nằm trong Cloudflare R2.

Nếu tên câu lạc bộ hoặc câu giới thiệu cần sửa, mở `src/data/site.ts`.

## Xem trên máy

Cần [Node.js](https://nodejs.org/) 20 trở lên.

```powershell
npm install
npm run dev
```

Mở địa chỉ in ra trong cửa sổ lệnh, thường là `http://localhost:4321`.

Vào **Đăng ký** để tạo tài khoản doanh nghiệp, rồi viết một bài và tải ảnh. Mỗi tài khoản doanh nghiệp chỉ giữ một bài; lưu lại là sửa bài đó.

Tài khoản ban biên tập câu lạc bộ viết được nhiều bài. Trên máy, đăng nhập bằng `clb@deic.vn` và mật khẩu `Deic@DoLuong2026`. Tài khoản này được tạo ở lần mở trang đầu tiên. Khi đưa lên mạng, thêm biến `CLUB_PASSWORD` trên Cloudflare trước lần truy cập đầu; nếu không có biến đó, tài khoản câu lạc bộ không được tạo.

Nếu cửa sổ lệnh nhắc binding `SESSION`, cứ bỏ qua. Phần đăng nhập của trang dùng cookie, không dùng KV đó.

## Thêm một bài

Tạo file mới trong `src/content/blog/`, tên file không dấu, viết thường, cách nhau bằng gạch ngang. Ví dụ `src/content/blog/gap-mat-thang-11.md`:

```md
---
title: Tiêu đề bài
description: Một câu tóm tắt, hiện ở trang chủ.
pubDate: 2026-11-01
author: Ban biên tập DEIC
tags:
  - Hoạt động
---

Nội dung viết bằng Markdown.

## Một đề mục

Đoạn văn tiếp theo.
```

Lưu file, chạy lại `npm run dev` (hoặc đẩy code lên GitHub nếu trang đã nối Cloudflare). Bài mới tự có địa chỉ `/bai-viet/gap-mat-thang-11/`.

## Đưa lên mạng, không cần máy chủ

Dùng Cloudflare Pages, gói miễn phí. Cloudflare giữ file HTML và trả cho người xem. Không có máy chủ để bảo trì.

### 1. Đưa code lên GitHub

Tạo một repository, rồi trong thư mục này:

```powershell
git init
git add .
git commit -m "Trang tin DEIC"
git branch -M main
git remote add origin https://github.com/TEN-TAI-KHOAN/deic-vn.git
git push -u origin main
```

### 2. Tạo trang trên Cloudflare Pages

1. Đăng ký tại [https://dash.cloudflare.com](https://dash.cloudflare.com).
2. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Chọn repository vừa đẩy lên.
4. Điền:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Deploy. Xong sẽ có một địa chỉ tạm kiểu `deic-vn.pages.dev`. Mở thử địa chỉ đó trước khi trỏ tên miền.

Mỗi lần đẩy code lên nhánh `main`, Cloudflare tự dựng lại trang.

### Tài khoản doanh nghiệp

Mỗi doanh nghiệp đăng ký một tài khoản và viết đúng một bài, có ảnh. Ban biên tập đăng nhập bằng `clb@deic.vn` để viết nhiều bài câu lạc bộ; các bài đó hiện cùng mục bài câu lạc bộ. Bài soạn sẵn vẫn là file Markdown trong `src/content/blog/`.

Trên Cloudflare, tạo hai dịch vụ miễn phí rồi gắn vào project Pages, mục **Settings → Bindings**:

1. **D1**: tạo database tên `deic`. Binding name phải là `DB`. Lấy `database_id` dán vào `wrangler.jsonc`.
2. **R2**: tạo bucket tên `deic-images`. Binding name phải là `IMAGES`.
3. **Variable**: thêm `SESSION_SECRET`, một chuỗi ngẫu nhiên dài (ít nhất 32 ký tự), và `CLUB_PASSWORD` cho tài khoản `clb@deic.vn`. Không để hai secret này trong Git. `CLUB_PASSWORD` chỉ dùng lúc tạo tài khoản lần đầu.

Bảng dữ liệu được tạo ở lần truy cập đầu. Ảnh quê hương trong `public/images/` lấy từ Wikimedia Commons, nguồn ghi dưới mỗi ảnh.

### 3. Trỏ deic.vn về trang này

Cách gọn nhất là để Cloudflare quản lý DNS của tên miền.

1. Trong Cloudflare, **Add a site** → nhập `deic.vn` → chọn gói Free.
2. Cloudflare đưa hai nameserver, dạng `xxx.ns.cloudflare.com`.
3. Đăng nhập nơi đã mua tên miền (Mắt Bão, PA Việt Nam, Nhân Hòa, iNET, Tenten hoặc nhà đăng ký khác). Tìm mục **Nameserver** / **DNS** / **Đổi máy chủ tên miền**.
4. Thay nameserver mặc định bằng hai nameserver Cloudflare vừa đưa. Lưu.
5. Đợi Cloudflare báo tên miền đã active. Thường vài giờ, có khi tới 24 giờ.
6. Vào project Pages → **Custom domains** → thêm `deic.vn` và `www.deic.vn`. Cloudflare tự tạo bản ghi DNS.

Nên giữ một địa chỉ chính. Trong **Rules** → **Redirect Rules**, tạo luật: nếu hostname là `www.deic.vn` thì chuyển 301 sang `https://deic.vn`.

Tên miền `.vn` cho đổi nameserver. Không cần mua VPS, không cần trỏ bản ghi A vào một máy chủ riêng.

### 4. Hòm thư lienhe@deic.vn, cũng không cần máy chủ

Sau khi tên miền đã nằm trong Cloudflare:

1. **Email** → **Email Routing** → bật.
2. Thêm địa chỉ `lienhe@deic.vn`, chuyển tiếp về Gmail (hoặc hộp thư cá nhân) của người phụ trách.
3. Cloudflare sẽ yêu cầu xác nhận hộp thư đích.

Sửa địa chỉ công khai trong `src/data/site.ts` nếu muốn dùng tên khác, ví dụ `banlienlac@deic.vn`.

## Nếu nhà đăng ký không cho đổi nameserver

Giữ DNS ở nhà đăng ký và thêm bản ghi:

| Loại | Tên | Giá trị |
| --- | --- | --- |
| CNAME | `www` | `ten-project.pages.dev` |

Tên miền gốc `deic.vn` (không có `www`) thường không nhận CNAME. Khi đó vẫn nên đổi nameserver sang Cloudflare như bước 3. Đó là cách để `https://deic.vn` chạy mà không có máy chủ.
