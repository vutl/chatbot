# System crwaler from ZenAI API : 

## Tổng quan
- System được viết bằng NestJS và sử dụng các API từ ZenAI.
- Thực hiện lấy dữ liệu về chứng khoán, tin tức , dữ liệu từ backend của ZenAI về để xử lý và lưu trữ trong chromaDB
- Phục vụ cho việc bổ sung dữ liệu RAG cho hệ thống.

## Luồng hiện tại : 
- Thực hiện Khởi chạy service. 
- Thực hiện chạy cronjob sau 10 phút 1 lần để lấy dữ liệu từ API ZenAI về. 
- Khi chạy thì thực hiện call API Login để lấy accessToken ZenAI 
- Sau khi có accessToken thì thực hiện lấy dữ liệu từ API ZenAI về. 
- Thực hiện lưu trữ dữ liệu vào chromaDB. 

## Hướng dẫn khởi chạy hệ thống : 
1. Cài đặt các dependencies : 
```bash
npm install
```
2. Cấu hình môi trường : 
- Tạo file `.env.zenai` và thêm các biến môi trường cần thiết.
- Service sẽ được chạy bằng PM2 với các lệnh : 
```bash
pm2 start src/app.module.ts --name "zenai-crawler"
```
3. Chạy hệ thống : 
- Build code : 
```bash
npm run build:zenai
```
- Chạy cho môi trường dev : 
```bash
npm run start:zenai:dev
```
- Chạy cho môi trường prod : 
```bash
npm run start:zenai:prod
```
### Chạy bằng pm2 : 

** Lưu ý : 2. File .env.zenai cần được copy vào thư mục chứa file build (dist/) : Không biết đúng ko .

- Build code : Đã được tóm gọn vào trong 1 script sau : 

```bash
npm run build:start:zenai:prod
```






