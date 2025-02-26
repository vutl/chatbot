# Web Client cho Chatbot

Đây là giao diện web cho hệ thống chatbot, được xây dựng bằng React và TypeScript.

## Công nghệ sử dụng

- React + TypeScript
- Vite
- Chakra UI
- Axios

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file môi trường:
Tạo file `.env` với nội dung:
```
VITE_API_URL=http://localhost:3000
```

## Phát triển

Chạy server phát triển:
```bash
npm run dev
```

## Build

Build ứng dụng cho production:
```bash
npm run build
```

## Cấu trúc thư mục

```
src/
  ├── components/     # React components
  ├── services/      # API services
  ├── types/         # TypeScript types
  └── App.tsx        # Root component
```

## Tính năng

- Giao diện chat thân thiện với người dùng
- Real-time chat với chatbot
- Hỗ trợ responsive design
- Xử lý lỗi và loading states
- Tự động cuộn đến tin nhắn mới nhất
