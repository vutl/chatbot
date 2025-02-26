

# Danh sách các đầu API : 

## Địa chỉ cơ bản và xác thực : 
- https://zenapi.tambaogroup.com/api/
- Các đầu API này ko cần truyền hay xác thực thông qua AccessToken 
## 1. Đầu API tin tức thị trường : 

curl 'https://zenapi.tambaogroup.com/api/zenai/Posts/search?PostTypeId=1&PageIndex=1&PageSize=40' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 
{
    "Items": [{
        "Id": 11600,
        "Title": "HPX: Quý 4 lãi gần 5,7 tỷ, HPX bị phạt thuế hơn 5 tỷ đồng",
        "SubTitle": "Nguyên nhân là do HPX đã có nhưng hành vi như: Khai sai dẫn đến thiếu số tiền thuế phải nộp; khai sai, khai không đầy đủ các chỉ tiêu liên quan đến xác định nghĩa vụ thuế trong hồ sơ thuế nhưng không dẫn đến thiếu số thuế phải nộp; không nộp các phụ lục theo quy định về quản lý thuế đối với doanh nghiệp có giao dịch liên kết.",
        "Url": "hpx-quy-4-lai-gan-5-7-ty-hpx-bi-phat-thue-hon-5-ty-dong",
        "Description": "Nguyên nhân là do HPX đã có nhưng hành vi như: Khai sai dẫn đến thiếu số tiền thuế phải nộp; khai sai, khai không đầy đủ các chỉ tiêu liên quan đến xác định nghĩa vụ thuế trong hồ sơ thuế nhưng không dẫn đến thiếu số thuế phải nộp; không nộp các phụ lục theo quy định về quản lý thuế đối với doanh nghiệp có giao dịch liên kết.",
        "Content": "",
        "ShortContent": "Nguyên nhân là do HPX đã có nhưng hành vi như: Khai sai dẫn đến thiếu số tiền thuế phải nộp; khai sai, khai không đầy đủ các chỉ tiêu liên quan đến xác định nghĩa vụ thuế trong hồ sơ thuế nhưng không dẫn đến thiếu số thuế phải nộp; không nộp các phụ lục theo quy định về quản lý thuế đối với doanh nghiệp có giao dịch liên kết.",
        "Source": "",
        "CoverImage": "",
        "PostTypeId": 1,
        "IsShowHome": true,
        "AISumaryContent: "aa",
        "Tags" : "aa".
        "IsPublished": true,
        "CreateTime": "2025-02-12T10:03:28.7829537",
        "Author": "ZenAI Team",
        "WorkflowId": 0,
        "Evaluate": 1,
        "Images": [],
        "PostType": {
            "Id": 1,
            "Name": "Tin tức",
            "Description": "",
            "SortOrder": 0,
            "IsShowOnHome": false,
            "ParentId": 0,
            "IsDelete": false,
            "Status": 0,
            "TotalOfPosts": 0
        }
    }],
    "TotalRecord": 9734,
    "Status": true,
    "Message": ""
}

## 2. Đầu API Kiến thức chứng khoán : 

curl 'https://zenapi.tambaogroup.com/api/zenai/Posts/search?PostTypeId=5&PageIndex=1&PageSize=40' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 
{
    "Items": [{
        "Id": 1046,
        "Title": "Tại sao nên tôn trọng xu hướng thị trường",
        "SubTitle": "Tại sao nên tôn trọng xu hướng thị trường",
        "Url": "tai-sao-nen-ton-trong-xu-huong-thi-truong-1725807173233-1725930770756-1735356760331-1735356768766-1735356814569",
        "Description": "Trích lời của Warren Buffett: “Hãy sợ hãi khi người khác tham lam và tham lam khi người khác sợ hãi”.\r\n\r\nPhát biểu trên của  của phù thủy xứ Omaha, được mệnh danh là nhà đầu tư kiệt xuất nhất mọi thời đại, của ông đã phủ sóng trên vô các phương tiện truyền thông trong gần 2 thập kỷ qua. Tuy nhiên, không phải ai cũng có thể thấu hiểu thật sự ý nghĩa của danh ngôn này. ",
        "Content": "",
        "ShortContent": "Trích lời của Warren Buffett: “Hãy sợ hãi khi người khác tham lam và tham lam khi người khác sợ hãi”.\r\n\r\nPhát biểu trên của  của phù thủy xứ Omaha, được mệnh danh là nhà đầu tư kiệt xuất nhất mọi thời đại, của ông đã phủ sóng trên vô các phương tiện truyền thông trong gần 2 thập kỷ qua. Tuy nhiên, không phải ai cũng có thể thấu hiểu thật sự ý nghĩa của danh ngôn này. ",
        "Source": "",
        "CoverImage": "",
        "PostTypeId": 5,
        "IsShowHome": false,
        "AISumaryContent" : "aa",
        "Tags": "a",
        "IsPublished": true,
        "CreateTime": "2024-09-08T21:52:43.0909246",
        "Author": "Hong Min",
        "WorkflowId": 0,
        "Evaluate": 0,
        "Images": [],
        "PostType": {
            "Id": 5,
            "Name": "Kiến thức chứng khoán",
            "Description": "",
            "SortOrder": 0,
            "IsShowOnHome": false,
            "ParentId": 0,
            "IsDelete": false,
            "Status": 0,
            "TotalOfPosts": 0
        }
    }],
    "TotalRecord": 34,
    "Status": true,
    "Message": ""
}

## 3. Đầu API Sản phẩm và dịch vụ : 

curl 'https://zenapi.tambaogroup.com/api/zenai/Posts/search?PostTypeId=6&PageIndex=1&PageSize=40' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "Items": [{
        "Id": 1319,
        "Title": "Giới thiệu về ZenAI - Nền tảng hỗ trợ đầu tư toàn diện",
        "SubTitle": "Giới thiệu về ZenAI - Nền tảng hỗ trợ đầu tư toàn diện",
        "Url": "gioi-thieu-ve-zenai---nen-tang-ho-tro-dau-tu-toan-dien-1726082540981-1726082544083-1726082549469-1726082556233-1726082619528-1726082671016-1726082706597-1733686261188-1733686269253-1733686301031-1733686856341",
        "Description": "ZenAI by TBG: Nền tảng tư vấn đầu tư chứng khoán và tài chính hàng đầu, kết hợp sức mạnh của trí tuệ nhân tạo (AI) và phân tích định lượng tiên tiến, mang đến cho bạn giải pháp đầu tư toàn diện.\r\nVới khả năng phân tích dữ liệu lớn và dự đoán chính xác xu hướng thị trường, ZenAI giúp bạn xây dựng danh mục đầu tư tối ưu, đảm bảo cơ hội sinh lời cao và kiểm soát rủi ro hiệu quả.\r\nZenAI được thiết kế để hỗ trợ từ nhà đầu tư mới bắt đầu đến chuyên gia tài chính, giúp bạn đưa ra quyết định nhanh chóng, tự tin và chính xác. Với ZenAI, bạn không còn phải lo lắng trước những biến động của thị trường – tất cả đã nằm trong tầm kiểm soát của bạn.",
        "Content": "",
        "ShortContent": "ZenAI by TBG: Nền tảng tư vấn đầu tư chứng khoán và tài chính hàng đầu, kết hợp sức mạnh của trí tuệ nhân tạo (AI) và phân tích định lượng tiên tiến, mang đến cho bạn giải pháp đầu tư toàn diện.\r\nVới khả năng phân tích dữ liệu lớn và dự đoán chính xác xu hướng thị trường, ZenAI giúp bạn xây dựng danh mục đầu tư tối ưu, đảm bảo cơ hội sinh lời cao và kiểm soát rủi ro hiệu quả.\r\nZenAI được thiết kế để hỗ trợ từ nhà đầu tư mới bắt đầu đến chuyên gia tài chính, giúp bạn đưa ra quyết định nhanh chóng, tự tin và chính xác. Với ZenAI, bạn không còn phải lo lắng trước những biến động của thị trường – tất cả đã nằm trong tầm kiểm soát của bạn.",
        "Source": "",
        "CoverImage": "",
        "PostTypeId": 6,
        "IsShowHome": false,
        "AISumaryContent": "",
        "Tags": "",
        "IsPublished": true,
        "CreateTime": "2024-09-12T02:13:30.6427705",
        "Author": "ZenAI Team",
        "WorkflowId": 0,
        "Evaluate": 0,
        "Images": [],
        "PostType": {
            "Id": 6,
            "Name": "Sản phẩm và dịch vụ",
            "Description": "",
            "SortOrder": 0,
            "IsShowOnHome": false,
            "ParentId": 0,
            "IsDelete": false,
            "Status": 0,
            "TotalOfPosts": 0
        }
    }],
    "TotalRecord": 2,
    "Status": true,
    "Message": ""
}

## 4. Đầu API Nhận định chứng khoán : 

curl 'https://zenapi.tambaogroup.com/api/zenai/Posts/search?PostTypeId=2&PageIndex=1&PageSize=40' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "Items": [{
        "Id": 2834,
        "Title": "Nhận định thị trường ngày 30/09/2024",
        "SubTitle": "Nhận định thị trường ngày 30/09/2024",
        "Url": "nhan-dinh-thi-truong-ngay-30-09-2024-1727661773569-1727661779052-1727661787933",
        "Description": "Vnindex đang trong hình thái tích lũy và từng bước tiệm cận đỉnh lích sử 1300 điểm. Đây là nhận định được xác nhận trên khung đồ thị tuần của Vnindex và cơ hội bứt phá đang trở nên ngày càng lớn khi sức nén của biên độ giá và khối lượng đi kèm đều ủng hộ qua điểm này. Dưới góc nhìn kỹ thuật, mẫu hình đáy sau cao hơn đáy trước đang tiếp tục trở nên hoàn thiện giúp đẩy cao xác suất tạo bứt phá mới về xu thế của thị trường.\r\nTrong bối cảnh vĩ mô khởi sắc dần qua từng quý thể hiện ở nhiều khía cạnh của nền kinh tế như FDI, GDP, PMI, Lạm phát, XNK...kỳ vọng sự vận động của dòng tiền trên các kênh đầu tư đặc biệt là trên thị trường chứng khoán cũng sẽ có chuyển biến đồng thuận mới. Nền tảng vĩ mô tích cực c",
        "Content": "",
        "ShortContent": "Vnindex đang trong hình thái tích lũy và từng bước tiệm cận đỉnh lích sử 1300 điểm. Đây là nhận định được xác nhận trên khung đồ thị tuần của Vnindex và cơ hội bứt phá đang trở nên ngày càng lớn khi sức nén của biên độ giá và khối lượng đi kèm đều ủng hộ qua điểm này. Dưới góc nhìn kỹ thuật, mẫu hình đáy sau cao hơn đáy trước đang tiếp tục trở nên hoàn thiện giúp đẩy cao xác suất tạo bứt phá mới về xu thế của thị trường.\r\nTrong bối cảnh vĩ mô khởi sắc dần qua từng quý thể hiện ở nhiều khía cạnh của nền kinh tế như FDI, GDP, PMI, Lạm phát, XNK...kỳ vọng sự vận động của dòng tiền trên các kênh đầu tư đặc biệt là trên thị trường chứng khoán cũng sẽ có chuyển biến đồng thuận mới. Nền tảng vĩ mô tích cực c",
        "Source": "",
        "CoverImage": "",
        "PostTypeId": 2,
        "IsShowHome": false,
        "AISumaryContent": "",
        "Tags": "",
        "IsPublished": true,
        "CreateTime": "2024-09-30T09:02:49.8539401",
        "Author": "ZenAI Team",
        "WorkflowId": 0,
        "Evaluate": 0,
        "Images": [],
        "PostType": {
            "Id": 2,
            "Name": "Nhận định",
            "Description": "",
            "SortOrder": 0,
            "IsShowOnHome": false,
            "ParentId": 0,
            "IsDelete": false,
            "Status": 0,
            "TotalOfPosts": 0
        }
    }],
    "TotalRecord": 23,
    "Status": true,
    "Message": ""
}

## 5. Đầu API Tín hiệu khuyến nghị : 

curl 'https://zenapi.tambaogroup.com/api/zenai/SuggestStocks/search?PageIndex=1&PageSize=20' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "Items": [{
        "Score": 89,
        "Signal": "Đã mua",
        "PercentChangePriceCurrent": 30.2,
        "SignalPrice": "27.1",
        "BuyDate": "2024-05-16T00:00:00",
        "SellDate": "2024-06-17T00:00:00",
        "StockId": 117,
        "NameStock": "Ngân hàng Thương mại Cổ phần Bưu điện Liên Việt",
        "CodeStock": "LPB",
        "Id": 8
    }],
    "TotalRecord": 4,
    "Status": true,
    "Message": ""
}

## 6. Đầu API Tín hiệu mua bán : 

curl 'https://zenapi.tambaogroup.com/api/zenai/BuySellSignals/search?PageIndex=1&PageSize=20' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn' \

### Response : 

{
    "Items": [{
        "CodeStock": "SSI",
        "Signal": "Nắm giữ",
        "TypeSignal": "Ngắn hạn",
        "StockName": "",
        "Density": 10,
        "Id": 246,
        "Price": 24.2,
        "LN": "2.48",
        "BuyDate": "15/01/2025",
        "SellDate": ""
    }],
    "TotalRecord": 11,
    "Status": true,
    "Message": ""
}

## 7. Đầu API Quan điểm các CTCK về 1 mã chứng khoán : 
- Thay CodeStock để lấy dữ liệu quan điểm các CTCK về 1 mã chứng khoán.

curl 'https://zenapi.tambaogroup.com/api/zenai/CTCKInStocks/search?CodeStock=VCI&PageIndex=1&PageSize=5' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "Items": [{
        "Id": 8816,
        "Date": "2024-12-18T00:00:00",
        "Signal": "Mua",
        "SignalPrice": "33.8",
        "City": "HSC",
        "StockId": 0,
        "StockName": "VCI"
    }, {
        "Id": 9009,
        "Date": "2024-12-02T00:00:00",
        "Signal": "Nắm giữ",
        "SignalPrice": "35.062",
        "City": "FSC",
        "StockId": 0,
        "StockName": "VCI"
    }, {
        "Id": 6854,
        "Date": "2024-08-20T00:00:00",
        "Signal": "Mua",
        "SignalPrice": "49.5",
        "City": "HSC",
        "StockId": 0,
        "StockName": "VCI"
    }, {
        "Id": 7097,
        "Date": "2024-07-25T00:00:00",
        "Signal": "Nắm giữ",
        "SignalPrice": "45.58",
        "City": "FSC",
        "StockId": 0,
        "StockName": "VCI"
    }],
    "TotalRecord": 4,
    "Status": true,
    "Avg": 40.99,
    "Hold": 2,
    "Buy": 2,
    "Sell": 0
}

## 8. Đầu API Lấy thông tin cơ bản của 1 mã chứng khoán : 
- Thay code để lấy dữ liệu thông tin cơ bản của 1 mã chứng khoán.

curl 'https://zenapi.tambaogroup.com/api/zenai/Stocks?code=VCI' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "SLCPLH": "",
    "Growth": 0,
    "Id": 210,
    "CodeStock": "VCI",
    "NameStock": "Công ty Cổ phần Chứng khoán VIETCAP",
    "Exchange": "HOSE",
    "FreeFloatRate": "32.46",
    "EVEBITDA": "0",
    "EnterpriseValue": "24846241177600",
    "BookValuePerShare": "19",
    "SalesPerShare": " 6",
    "CurrentVolume": "578900",
    "AverageVolumeLast20Session": "7721340",
    "PE": "27.28",
    "EPS": "1268.2",
    "PS": "5.32",
    "PB": "1.92",
    "ROE": "8.965475093383949",
    "ROA": "4.153929487237543",
    "ClosePrice": 34.7,
    "Capitalization": "24846241177600",
    "StockRatingGeneral": "74",
    "StockBasicPoint": "93",
    "StockPriceRating": "55",
    "GTGD": "578900",
    "DividendRate": "0%",
    "IsShowHot": false,
    "DateHold": 41588,
    "ProbabilityT": 65.6,
    "ProbabilityShortTerm": 70.81622071439605,
    "ProbabilityRisk": 30.92,
    "ModifiedTime": "0001-01-01T00:00:00",
    "FieldGroup": {
        "Id": 0,
        "Name": "Tài chính",
        "Description": "Tài chính",
        "Order": 0,
        "CreatedTime": "2025-02-12T11:27:28.9316666+07:00",
        "CreatedUser": "",
        "ModifiedTime": "2025-02-12T11:27:28.9316666+07:00",
        "ModifiedUser": "",
        "IsDeleted": false
    },
    "IndustryGroup": {
        "Id": 0,
        "Name": "Chứng khoán và Ngân hàng đầu tư",
        "Description": "Chứng khoán và Ngân hàng đầu tư",
        "Order": 0,
        "CreatedTime": "2025-02-12T11:27:28.931667+07:00",
        "CreatedUser": "",
        "ModifiedTime": "2025-02-12T11:27:28.931667+07:00",
        "ModifiedUser": "",
        "IsDeleted": false
    }
}

## 9. Đầu API Lấy dữ liệu chiến lược giao dịch của 1 mã : 
- Thay CodeStock để lấy dữ liệu chiến lược giao dịch của 1 mã chứng khoán.

curl 'https://zenapi.tambaogroup.com/api/zenai/TradingStrategies/search?CodeStock=VCI&PageIndex=1&PageSize=20' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: en-US,en;q=0.9,vi;q=0.8' \
  -H 'origin: https://stock.zenai.ai.vn'

### Response : 

{
    "Items": [{
        "Id": 335,
        "PercentDisbursement1": "42.00",
        "PercentDisbursement2": "39.06",
        "TargetNear": "49.98",
        "TargetFar": "54.60",
        "StopShortening": "0.00",
        "TypOfStock": 0,
        "TypeOfSignal": 2,
        "ModifiedTime": "2024-09-09T01:40:27.6948536"
    }],
    "TotalRecord": 4,
    "Status": true,
    "Message": ""
}