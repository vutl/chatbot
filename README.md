# Stock AI Agent - Hệ thống Trợ lý AI Phân tích Chứng khoán

## Tổng quan
Stock AI Agent là hệ thống trợ lý thông minh hỗ trợ phân tích và đưa ra khuyến nghị về chứng khoán tại thị trường Việt Nam, sử dụng công nghệ AI thông qua OpenAI API kết hợp với Retrieval Augmented Generation (RAG) để cung cấp phân tích chính xác và cập nhật. Hệ thống tích hợp thêm Google Search để thu thập thông tin mới nhất về thị trường chứng khoán.

## Tech Stack

### Backend
- NestJS (Node.js + TypeScript)
- OpenAI GPT-3.5 Turbo
- ChromaDB (Vector Database)
- PostgreSQL
- Google Search API
- Swagger/OpenAPI
- PM2

### Frontend  
- React + TypeScript
- Chakra UI
- Vite
- Axios

## Kiến trúc hệ thống

### 1. Luồng xử lý chính
1. **Thu thập dữ liệu**:
   - Crawl dữ liệu từ Google Search API
   - Import dữ liệu từ files
   - Cập nhật real-time từ các nguồn tin

2. **Xử lý văn bản**:
   - Phân tích và làm sạch dữ liệu
   - Phân đoạn thành chunks tối ưu
   - Tạo embeddings với OpenAI

3. **Lưu trữ vector**:
   - Tổ chức dữ liệu trong ChromaDB
   - Quản lý metadata và nguồn
   - Cập nhật và đồng bộ dữ liệu

4. **Xử lý câu hỏi**:
   - Phân tích ý định người dùng
   - Tìm kiếm thông tin liên quan
   - Tổng hợp và trả về kết quả

### 2. Các Module chính

#### Google Search Module
- Tích hợp Google Search API
- Tìm kiếm thông tin mới nhất
- Lọc và xử lý kết quả tìm kiếm
- Rate limiting và cache

#### Document Processing Module
- Xử lý nhiều định dạng file
- Phân tích cấu trúc văn bản
- Trích xuất thông tin quan trọng
- Quản lý metadata

#### OpenAI Module
- Tích hợp OpenAI API
- Quản lý context và prompts
- Tối ưu hóa tokens
- Xử lý streaming responses

#### Vector Store Module
- Quản lý ChromaDB collections
- Tìm kiếm semantic
- Cập nhật và đồng bộ dữ liệu
- Backup và recovery

## Cấu trúc dự án
```
project/
├── src/                    # Backend source
│   ├── modules/           
│   │   ├── openai/        # OpenAI integration
│   │   ├── vector-store/  # ChromaDB integration
│   │   ├── document-processor/ # Document processing
│   │   └── stock-analysis/# Stock analysis logic
│   └── main.ts           # Entry point
├── web-client/            # Frontend source
└── package.json
```

## Thiết lập dự án

### 1. Yêu cầu hệ thống
- Node.js >= 18
- npm >= 9
- ChromaDB server
- PostgreSQL

#### Cài đặt ChromaDB : 

- Tải image ChromaDB mới nhất
docker pull chromadb/chroma:latest

- Chạy container
docker run -d \
  --name chroma \
  -p 8000:8000 \
  -e ALLOW_RESET=TRUE \
  -v chroma_data:/chroma/chroma \
  chromadb/chroma:latest

### 2. Cài đặt dependencies

### TH Lỗi vào server luôn bị chuyển về node v12, dù đã cài và chọn v22 trước đó : 
- Thường server ubuntu của ZenAI hiện tại khi ssh vào thường bị node version là 12. Cần chuyển sang v22. 
- Khởi động NVM
source ~/.bashrc
- Chuyển sang sử dụng Node.js v22
nvm use 22


```bash
# Cài đặt tất cả dependencies
npm run install:all

# Cài đặt PM2 global (nếu chưa có)
npm install -g pm2
```

### 3. Cấu hình môi trường

**Backend (.env)**:
```env
OPENAI_API_KEY=your_api_key
CHROMA_URL=your_chroma_db_url
DATABASE_URL=your_database_url
PORT=4301
# Google Custom Search API
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_google_cse_id
```

**Frontend (web-client/.env.development)**:
```env
VITE_API_URL=http://localhost:4301
PORT=4302
```

**Frontend (web-client/.env.production)**:
```env
VITE_API_URL=https://api.yourdomain.com
PORT=4302
```

## Khởi tạo và chạy dự án

### 1. Khởi tạo dự án lần đầu

```bash
# Clone dự án
git clone <repository_url>
cd ai-agent-01

# Cài đặt dependencies cho cả backend và frontend
npm run install:all

# Tạo các file môi trường
cp .env.example .env
cp web-client/.env.example web-client/.env.development
cp web-client/.env.example web-client/.env.production

# Cấu hình các biến môi trường trong các file .env
```

### 2. Development Mode

#### Backend Development
```bash
# Terminal 1 - Chạy ChromaDB (nếu chạy local)
docker run -p 8000:8000 chromadb/chroma

# Terminal 2 - Chạy NestJS trong chế độ development
npm run backend:dev     # http://localhost:4301
```

#### Frontend Development
```bash
# Terminal 3 - Chạy React dev server
npm run client:dev     # http://localhost:4302
```

#### Chạy cả Backend và Frontend
```bash
# Chạy cả 2 song song với concurrently
npm run dev
```

### 3. Production Mode

#### Build dự án
```bash
# Build cả backend và frontend cho production
npm run build:prod

# Build riêng từng phần
npm run backend:build  # Build backend
npm run client:build:prod  # Build frontend
```

#### Chạy với PM2

1. **Cấu hình PM2**
```bash
# Kiểm tra file ecosystem.config.js đã có các cấu hình cần thiết
# Đảm bảo các biến môi trường production đã được set
```

2. **Khởi động ứng dụng**
```bash
# Khởi động trong môi trường production
pm2 start ecosystem.config.js --env production

# Khởi động trong môi trường development
pm2 start ecosystem.config.js --env development
```

3. **Quản lý ứng dụng với PM2**
```bash
# Xem logs
pm2 logs

# Xem status
pm2 status

# Restart ứng dụng
pm2 restart all                        # Tất cả
pm2 restart stock.ai.api.prod         # Backend
pm2 restart stock.ai.client.prod      # Frontend

# Dừng ứng dụng
pm2 stop all

# Xóa khỏi PM2
pm2 delete all
```

### 4. Docker Deployment

```bash
# Build Docker images
docker-compose build

# Khởi động các containers
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng các containers
docker-compose down
```

## Domain và Port

### Development
- Backend API: http://localhost:4301
- Frontend: http://localhost:4302
- ChromaDB: http://localhost:8000

### Production
- Backend API: https://api.yourdomain.com
- Frontend: https://yourdomain.com
- ChromaDB: (internal network)

## Quản lý dữ liệu

### 1. Import dữ liệu mới
```bash
# API endpoint
POST /documents/process

# Cấu trúc thư mục data
src/
  data/
    *.txt   # Các file text cần import
```

### 2. Quản lý Vector Store
```bash
# Xem dữ liệu đã lưu
GET /documents/stored-data

# Xóa và import lại toàn bộ
POST /documents/reprocess

# Tìm kiếm similarity
GET /documents/search?query=your_query
```

### 3. Tương tác Chat
```bash
# Tạo session mới
POST /openai/chat
{
  "messages": [{"role": "user", "content": "câu hỏi"}]
}

# Tiếp tục chat với session cũ
POST /openai/chat
{
  "sessionId": "existing_session_id",
  "messages": [{"role": "user", "content": "câu hỏi tiếp theo"}]
}
```

## Quy trình phát triển

### Git Workflow
1. Branch naming:
- `feat/rag-integration`
- `fix/chroma-connection`
- `refactor/chat-flow`

2. Commit convention:
```bash
feat: thêm RAG vào chat flow
fix: sửa lỗi kết nối ChromaDB
refactor: tối ưu hóa context handling
```

## Xử lý lỗi thường gặp

### ChromaDB không kết nối
- Kiểm tra CHROMA_URL trong .env
- Đảm bảo ChromaDB server đang chạy
- Kiểm tra logs của ChromaDB

### RAG không trả về kết quả
- Kiểm tra dữ liệu trong vector store
- Xem logs của quá trình tìm kiếm
- Kiểm tra embedding creation

### Context bị mất
- Kiểm tra optimizeContext logic
- Xem logs của chat session
- Verify session management

## Security
- Rate limiting cho OpenAI API calls
- Validate và sanitize input
- Secure ChromaDB connection
- CORS configuration

## Monitoring
- Detailed logging cho RAG process
- Track embedding usage
- Monitor ChromaDB performance
- Session analytics

## Liên hệ
- **Email**: [bienpx224@gmail.com]
- **Issues**: [GitHub Issues](https://github.com/bienpx224)

## API Endpoints

### Document Processing
```bash
# Upload và xử lý file
POST /documents/upload
Content-Type: multipart/form-data

# Xử lý URL
POST /documents/process-url
{
  "url": "https://example.com/article"
}

# Tìm kiếm thông tin
GET /documents/search
Query params:
  - query: Câu hỏi tìm kiếm
  - limit: Số lượng kết quả (default: 5)
```

### OpenAI Integration
```bash
# Chat với context
POST /openai/chat
{
  "messages": [
    {"role": "user", "content": "Phân tích cổ phiếu VNM"}
  ],
  "useRAG": true,
  "useGoogleSearch": true
}

# Stream chat response
POST /openai/chat-stream
{
  "messages": [...],
  "stream": true
}
```

### Google Search
```bash
# Tìm kiếm thông tin
GET /google-search
Query params:
  - query: Từ khóa tìm kiếm
  - limit: Số lượng kết quả
```

## Môi trường và Cấu hình

### Biến môi trường bổ sung
```env
# Google Search API
GOOGLE_SEARCH_API_KEY=your_key
https://console.cloud.google.com/apis/credentials?inv=1&invt=AbqALg&project=be-mo-437308

GOOGLE_SEARCH_ENGINE_ID=your_engine_id
https://programmablesearchengine.google.com/controlpanel/overview?cx=37f1bdf78e94d4b60

# OpenAI
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=2000

# Document Processing
MAX_CHUNK_SIZE=1000
OVERLAP_SIZE=200
```

## Monitoring và Logging

### Metrics theo dõi
- API calls/minute
- Response time
- Token usage
- Search accuracy
- System resources

### Logging
- Request/Response logs
- Error tracking
- Performance metrics
- User interactions

### Alerts
- API rate limits
- Error rates
- System performance
- Token usage warnings

## Bảo mật

### API Security
- Rate limiting
- API key rotation
- Request validation
- Data encryption

### Data Protection
- PII handling
- Data retention
- Access control
- Audit logging
