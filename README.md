# Website kinh doanh quà tặng cá nhân hóa

## Cấu trúc dự án
```
my-gift-shop/
├── backend/        # NestJS
└── frontend/       # ReactJS
```

## Cài đặt Backend (NestJS)

### 1. Di chuyển vào thư mục backend

```bash
cd backend
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo biến môi trường

Tạo file `.env` tại thư mục `backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=giftshop

# JWT
JWT_SECRET=your_jwt_secret_key

# App
PORT=3000

# fal.ai
FAL_KEY=your_fal_api_key
```

### 4. Tạo database

```sql
CREATE DATABASE giftshop;
```

### 5. Khởi động server

```bash
npm run start:dev

Server chạy tại: `http://localhost:3000`

```

## Cài đặt Frontend (ReactJS)

### 1. Di chuyển vào thư mục frontend

```bash
cd frontend
```

### 2. Cài đặt dependencies

```bash
npm install
```


### 3. Khởi động frontend

```bash
npm run dev

Ứng dụng chạy tại: `http://localhost:5173`

