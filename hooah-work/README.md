# Hooah運動 板橋江翠店

Hooah運動板橋江翠店官方網站與預約系統：團體運動課程預約、1 對 1 減重諮詢、教練師資與管理後台。

## 網站頁面

| 路徑 | 內容 |
| --- | --- |
| `/` | 品牌首頁、精選課程、方案、環境、教練與交通資訊 |
| `/schedule` | 團體課週課表與資料庫預約 |
| `/consult` | 1 對 1 減重諮詢預約 |
| `/coaches` | 教練師資及預約入口 |
| `/login` | 管理員／教練登入 |
| `/admin` | 後台排課、名冊、簽到、教練與諮詢預約管理 |

## 技術架構

- React 19、TypeScript、Vite、TanStack Start／Router
- Netlify Functions：伺服器 API
- Netlify Database：PostgreSQL 與版本化 SQL migrations
- Netlify Identity：管理員／教練登入及角色權限

## 開發

```bash
npm install
npm run typecheck
npm run build
```

Windows 本機建置與 GitHub／Netlify 部署步驟請見 `BUILD_AND_DEPLOY_TW.md`。

## Netlify 部署

請先閱讀 [建置與正式部署（繁體中文）](BUILD_AND_DEPLOY_TW.md) 與 [部署設定教學（繁體中文）](docs/DEPLOY_SETUP_TW.md)。資料庫與 Identity 需要在 Netlify 專案後台啟用並完成帳號角色設定；僅部署 ZIP 不會自動建立管理員帳號。

## 產品路線圖

- 里程碑 1：前台與後台介面完成。
- 里程碑 2：資料庫 schema、初始課程／教練 seed 與資料 API 已加入。
- 里程碑 3：團體課及諮詢預約已接上資料庫；通知與取消／改期流程待補。
- 里程碑 5：Netlify Identity 登入與角色 API 權限已加入；仍需依部署教學設定帳號。
- 里程碑 6：排課、複製、拖曳、名冊、簽到、CSV 匯出及新增教練已接資料庫；教練帳號管理及照片上傳待補。
- 里程碑 7：媒體與成果案例資料表已建立；上傳管理介面及前台同步待補。

目前資料庫、Identity 及通知服務需完成 Netlify 後台設定並經正式部署測試後，才可作為正式營運系統使用。
