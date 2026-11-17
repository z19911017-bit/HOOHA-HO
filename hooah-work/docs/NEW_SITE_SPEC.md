# HOOAH 新版網站規格

## 視覺
- 白色／淺灰底色、深色文字、綠色品牌點綴。
- 主視覺採文字與照片雙欄；保留清楚的課表預約與減重諮詢 CTA。
- 圖片數量適中：首頁主視覺、課程、教練、學員成果、場館環境。

## 圖片管理
- 僅管理員可操作。
- 分類：hero、classes、coaches、results、venue、news。
- JPG、PNG、WebP、GIF；單張最大 4MB。
- 支援上傳、預覽、刪除、分類排序。
- 圖片二進位檔放 Netlify Blobs；索引資料放 Netlify Database。

## Netlify 部署必要條件
- 啟用 Netlify Database，套用 migration 001、002。
- 啟用 Netlify Identity，建立管理員並設定 `roles: ["admin"]`。
- `@netlify/blobs` 由 Netlify Functions 存取，勿將任何憑證寫入前端。
- 建置指令 `npm run build`；發布目錄 `dist/client`；Node 24。

## 仍需完成
- 正式場館／教練／課程照片與品牌文字替換。
- 新聞內容管理、影片上傳、LINE／Email 通知、會員帳號流程。
- 完整部署環境建置與實際 Netlify Deploy Preview 驗收。

## 後台內容管理擴充
- 管理員可編輯首頁主標、副標、介紹及按鈕文字。
- 管理員可新增、修改、停用課程種類與每週課程。
- 管理員可新增教練並停用教練；停用時保留歷史預約紀錄。
