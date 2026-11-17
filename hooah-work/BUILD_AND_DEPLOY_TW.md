# HOOAH 新版網站｜建置與正式部署

本專案使用 React、TypeScript、TanStack Start、Netlify Functions、Netlify Database、Netlify Identity 與 Netlify Blobs。

## A. 本機建置（Windows）

1. 安裝 Node.js 24 LTS（可從 https://nodejs.org/ 取得）。
2. 解壓縮 ZIP，進入內層 `hooah-work` 資料夾。
3. 在該資料夾空白處按右鍵，選「在終端機中開啟」。
4. 依序執行：

```powershell
node -v
npm -v
npm install
npm run typecheck
npm run build
```

5. 成功後會產生 `dist/client`。若要本機預覽，可執行：

```powershell
npm run preview
```

本機建置只驗證前端與打包流程；Netlify Identity 的正式登入必須在 HTTPS 的 Netlify Deploy Preview 或正式站測試。

## B. GitHub + Netlify 部署

此專案不是純靜態網頁，不能只把原始碼 ZIP 拖到 Netlify Drop。請將整個 `hooah-work` 專案推送到 GitHub，再讓 Netlify 連接該 Repository。

Netlify Build settings：

- Build command：`npm run build`
- Publish directory：`dist/client`
- Functions directory：`netlify/functions`
- Node version：24（已在 `netlify.toml` 設定）

專案已附 GitHub Actions 工作流程 `.github/workflows/build.yml`。推送到 `main` 或 `master` 後會執行依賴安裝、TypeScript 檢查與正式建置。

## C. Netlify 後台服務

### Database

- 在 Netlify 專案的 Data & Storage → Database 建立資料庫。
- 專案 migration 位於 `netlify/database/migrations/`。
- Netlify Database 會在部署流程套用 migrations。部署後確認資料表與初始課程、教練資料已建立。

### Identity

- 啟用 Identity。
- Registration preference 設為 Invite only。
- 建立／邀請管理員，並在該使用者的 App metadata 設定 `roles: ["admin"]`。
- 教練帳號設定 `roles: ["coach"]`，並依 `docs/DEPLOY_SETUP_TW.md` 綁定教練資料。
- 不要把正式密碼、資料庫連線字串或 Netlify token 寫進程式碼或傳到聊天。

### Blobs

圖片上傳使用 Netlify Blobs，需在 Netlify 部署環境中驗證上傳、讀取、排序與刪除。不要在正式站上傳未取得授權的學員照片。

## D. 上線驗收清單

- [ ] GitHub Actions 的 TypeScript 檢查通過
- [ ] GitHub Actions 的 production build 通過
- [ ] Netlify Deploy Preview 成功
- [ ] Database migrations 已套用
- [ ] 管理員可登入 `/login` 並開啟 `/admin`
- [ ] 未登入者不能讀取管理 API
- [ ] 教練角色不能使用管理員專屬功能
- [ ] 團體課預約可建立、額滿會進候補
- [ ] 諮詢預約可建立且不能重疊
- [ ] 圖片可上傳、前台顯示、排序及刪除
- [ ] 手機與桌面版版面正常

**注意：** 在 Netlify 專案尚未連接、資料庫尚未建立、Identity 尚未啟用之前，不能宣稱網站已完成正式上線。部署後也必須以實際帳號完成以上驗收。
