# Hooah! 正式後台部署設定（繁體中文）

這份程式已加入 Netlify Database、Netlify Identity 與 Netlify Functions 的整合骨架。**ZIP 解壓後仍需完成以下 Netlify 專案設定，才會開始使用正式資料庫與登入。**

## 1. 安裝與部署

**重要：本專案含 Netlify Functions、Database migrations 與 Blob 儲存，不能把原始碼 ZIP 直接拖到 Netlify Drop 當成正式網站部署。** 請解壓後將整個 `hooah-work` 專案推送至 GitHub，再由 Netlify 連接該 Repository 建置。

1. 將 ZIP 解壓縮，將整個專案資料夾上傳到 GitHub Repository（不要只上傳 `src`）。
2. 在 Netlify 選擇 Add new project → Import an existing project，連接該 GitHub Repository。
3. Build command：`npm run build`；Publish directory：`dist/client`。`netlify.toml` 已包含這些設定，可直接採用。
4. Node.js 使用 24（已寫入 `netlify.toml`）。
5. Netlify 部署時會依 `package.json` 安裝套件。`@netlify/database` 與 `@netlify/identity` 已列為正式依賴。

## 2. 啟用 Netlify Database

1. 進入 Netlify 專案的 Data & Storage → Database。
2. 建立 Netlify Database（此功能需支援 Credit-based 的 Netlify 方案；資料庫運算與流量會計入 credits）。
3. 確認 Repository 內存在 `netlify/database/migrations/001_initial_schema.sql` 與 `002_media_categories.sql`。
4. 重新部署。Netlify 會在部署流程自動套用 migration，建立教練、課程、會員、課程場次、預約、諮詢、媒體及成果案例資料表，並帶入目前的 19 組週期課表與 2 位示範教練。
5. 部署完成後，從網站測試 `/schedule` 預約及 `/admin` 資料讀取。

不要將資料庫密碼、連線字串或 Netlify 管理 token 放進 `src` 或任何前端環境變數。`@netlify/database` 會在 Netlify Functions 中取得目前 deploy 對應的資料庫連線。

## 3. 啟用 Netlify Identity

1. 進入 Netlify 專案的 Project configuration → Identity，啟用 Identity。
2. 將註冊方式設為 Invite only，避免陌生人自行註冊後取得內部帳號。
3. 在 Identity 使用者管理頁建立／邀請管理員帳號。
4. 開啟該使用者，於 App metadata 的 `roles` 設定角色陣列：
   - 管理員：`["admin"]`
   - 教練：`["coach"]`
5. 使用者重新登入或更新 token 後，角色才會反映在登入憑證中。

登入網址：`/login`。後台網址：`/admin`。所有敏感資料 API 都會在伺服器端重新檢查角色；不要只依賴前端隱藏按鈕。

## 4. 將教練登入帳號綁定到教練資料

建立教練 Identity 使用者並設定 `roles: ["coach"]` 後，到 Netlify Database 的 SQL 查詢介面執行以下範例。請替換尖括號內的值，`coach_id` 必須是 `coaches.id` 內既有的教練 ID，例如 `coach-kai` 或 `coach-mia`。

```sql
INSERT INTO profiles (identity_user_id, email, display_name, role, coach_id)
VALUES ('<Identity User ID>', '<教練 Email>', '<教練姓名>', 'coach', 'coach-kai')
ON CONFLICT (identity_user_id)
DO UPDATE SET email = EXCLUDED.email,
              display_name = EXCLUDED.display_name,
              role = 'coach',
              coach_id = EXCLUDED.coach_id,
              active = true,
              updated_at = now();
```

管理員不需要建立 `profiles` 綁定資料，但 Netlify Identity 使用者必須有 `roles: ["admin"]`。

## 5. 目前已接上的功能

- `/login`：透過 Netlify Identity Functions 登入／登出。
- `/admin`：登入後才載入後台資料；管理員及教練角色分流。
- 團體課表：讀取資料庫週期課表與實際預約數；送出預約時於交易中檢查重複預約及名額，額滿則加入候補。
- 減重諮詢：讀取已預約時段，送出時以資料庫交易鎖定教練時段並檢查衝突。
- 管理後台：排課新增、編輯、複製到其他星期、拖曳移動、停用課程；讀取真實名冊、簽到、CSV 匯出；新增教練資料。
- 教練角色：API 僅回傳其綁定教練的課程、名冊及諮詢預約；不能操作管理員專屬功能。
- 首頁、教練頁及預約頁會讀取資料庫教練與週期課表。

## 6. 圖片管理操作

1. 使用 `roles: ["admin"]` 的管理員登入 `/admin`。
2. 開啟「圖片管理」，選擇首頁主視覺、課程照片、教練照片、學員成果、場館環境或最新消息分類。
3. 可填寫圖片名稱並上傳 JPG／PNG／WebP／GIF，單張上限 4MB。
4. 以卡片上的上下箭頭調整顯示順序，垃圾桶按鈕刪除。
5. 首頁會依分類讀取已上傳圖片；沒有上傳時仍使用原專案示意圖。

圖片存放在 Netlify Blobs，圖片索引與分類存放在 Netlify Database。請勿上傳未取得同意的學員照片或個人資料。

## 7. 尚待完成／正式上線前必測

- Email 確認信、LINE Messaging API 與課前提醒尚未串接；畫面不會假稱已發送通知。
- 教練帳號邀請／停用的管理介面、教練照片實際上傳流程尚待補完。
- 相片牆、短影音、主視覺影片及減脂成果案例已有資料表，但管理介面、Netlify Blobs 上傳及前台自動發布尚待完成。
- 諮詢預約的服務時長、教練工時等設定仍需後台設定介面。
- 目前舊首頁的部分品牌文案、影音牆及成果內容仍沿用原專案素材；請換成實際授權且確認正確的內容。
- 部署後請用管理員與教練兩個帳號各測一次，並測試額滿、重複手機、候補、取消、簽到與跨時段諮詢衝突。

## 8. 本機開發

```bash
npm install
npx netlify-cli dev
```

Netlify Identity 在本機開發環境的行為與正式環境不同；請以 Netlify Deploy Preview／正式部署測試登入流程。不要用本機 mock 登入代替正式權限測試。
