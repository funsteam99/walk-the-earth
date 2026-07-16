# 漫步地球（Walk the Earth）

一款以真實地理資料生成場景的第一人稱網頁散步遊戲。

目前公開測試版：[https://walk-the-earth-tw.funsteam99.chatgpt.site](https://walk-the-earth-tw.funsteam99.chatgpt.site)
<img width="994" height="601" alt="748096751_10243109903548029_4526875377261479627_n" src="https://github.com/user-attachments/assets/8c599183-6208-40cc-90e4-32d9c13918db" />

## 專案起點

使用者最初提出的提示詞：

> 打造一款網頁遊戲 我取名漫步地球 內容是第一人稱視角的散步遊戲 場景來自玩家輸入的經緯度 然後去開源的有建物樓層訊息的地圖取得地理資訊 用簡單3D元素建立場景 玩家是一個1:1的透明人 玩家視角有第一人稱以及背後跟隨兩種 地圖中遇到的實體物件生成需要評估是否全部生成 例如建築 道路等人造物 以及自然界物質 要有隨等高線的地形變化 如果遇到水體 則有緩慢下沉的效果直到海底 以上初步設定 你是否理解

後續補充的核心要求是：遊戲開始時以玩家目前位置作為預設經緯度。若定位或地圖服務不可用，仍必須讓玩家進入可遊玩的備援場景。

## 遊戲願景

「漫步地球」希望把地球上的任意座標轉換成可以行走的 3D 空間。它不是衛星影像瀏覽器，也不是精密測量工具，而是以開源地理資料為骨架、用簡化 3D 幾何重建世界的探索型遊戲。

設計原則：

- 玩家輸入經緯度，或直接使用裝置定位開始探索。
- 建築、道路、水域、植被、鐵路與地形盡量來自真實資料。
- 場景維持 1:1 公尺比例，玩家使用接近真人尺寸的透明角色。
- 第一人稱提供臨場感，背後跟隨視角可觀察角色與動作。
- 不盲目生成所有物件，而是依裝置畫質與物件預算控制場景複雜度。
- 線上服務失效時仍可遊玩，且清楚告知目前為離線模擬模式。

## 開發規畫

### 第一階段：可遊玩的 3D 原型

- 建立真正的 WebGL 3D 場景，而不是 2D 假透視。
- 實作玩家、相機、光源、霧、地面、建築與水面。
- 完成鍵盤移動、滑鼠環視、第一人稱及背後跟隨視角。
- 支援經緯度輸入與瀏覽器定位。

### 第二階段：接入真實地理資料

- 從 OpenStreetMap／Overpass 取得建築、道路和自然地物。
- 使用建築高度或 `building:levels` 建立簡化建築量體。
- 從 Copernicus GLO-90 高程資料建立起伏地形。
- 把經緯度換算成本地公尺座標，維持 1:1 空間尺度。

### 第三階段：遊戲性與移動穩定

- 加入碰撞、坡度限制、安全出生點與卡牆逃脫機制。
- 加入 Shift 衝刺、Space 跳躍、角色步行动画。
- 水域中降低速度、緩慢下沉，並允許按 Space 向上游。
- 修正滑鼠環視、A／D 方向及指南針方位。

### 第四階段：大型世界與效能

- 玩家接近區塊邊界時預載下一個區域。
- 切換區塊時重新置中本地座標，降低浮點誤差與座標飄移。
- 合併相同類型幾何、限制建築及道路數量、使用 InstancedMesh 生成樹木。
- 提供省電、平衡、高畫質三種效能預算。

### 第五階段：離線備援與服務恢復

- 內建淡水漁人碼頭固定場景快照。
- 地圖服務失敗時切換至離線模擬模式，不再與原經緯度連動。
- 離線模式停止區塊串流，避免重複失敗與場景跳動。
- 保留玩家原始目標座標，提供「重試原始座標」。
- 連線恢復後回到原座標並重新啟用區塊串流。

## 使用者追加的功能需求與處理結果

| 追加需求／回報 | 處理結果 | 狀態 |
| --- | --- | --- |
| 遊戲預設使用玩家位置 | 使用瀏覽器 Geolocation；失敗時使用淡水漁人碼頭 | 完成 |
| 原型不是真 3D | 改用 Three.js WebGL、透視相機和實體 3D 幾何 | 完成 |
| 點擊場景無法使用滑鼠環視 | 加入 Pointer Events、拖曳捕捉和相機 heading／pitch | 完成 |
| A、D 左右顛倒 | 修正側向向量與按鍵方向 | 完成 |
| 擔心網頁 3D 物件數量限制 | 加入幾何合併、實例化、畫質預算與物件數量上限 | 完成 |
| 加入 Shift + WASD 加速 | 地面與水中使用不同衝刺速度 | 完成 |
| 自動載入有時間差，需要提示 | 加入全畫面載入遮罩及狀態訊息 | 完成 |
| 新場景載入後會跳動 | 區塊切換時將玩家與座標原點重新置中 | 已改善 |
| 建築在邊界突然出現 | 提前在約 220 公尺處觸發下一區塊載入 | 已改善 |
| 加入指南針並檢查方向 | 加入指南針，依相機 heading 修正旋轉公式 | 完成 |
| 載入新場景後卡進建築 | 加入安全出生點與「已在碰撞內時允許向外離開」規則 | 完成 |
| 水體緩慢下沉直到海底 | 水域偵測、阻尼、下沉速度、海床高度與上游控制 | 完成 |
| 地圖失敗時使用淡水漁人碼頭 | 將固定場景快照打包進網站，不依賴即時地圖請求 | 完成 |
| 離線狀態必須提示 | 左上離線徽章與右下資料狀態說明 | 完成 |
| 離線模式不跟原經緯度連動 | 固定切換到 `25.18339, 121.41147`，停用串流 | 完成 |
| 離線後可以恢復原地點 | 保留原始座標並提供重試按鈕 | 完成 |

## 目前完成進度

整體 MVP 約 **90%**。

| 系統 | 進度 | 說明 |
| --- | ---: | --- |
| 真 3D 渲染 | 100% | Three.js WebGL、光影、霧、地形與水面 |
| 玩家與相機 | 95% | 第一／第三人稱、透明角色、環視、步行與跳躍 |
| 真實地圖生成 | 94% | 建築高度／樓層／離地高度、道路標示寬度／車道數、水域、線狀河流、公園、森林、鐵路與橋梁 |
| 真實高程地形 | 90% | 9×9 高程網格插值；仍可提高細節 |
| 移動與物理 | 90% | 斜向碰撞滑動、坡度減速、陡坡限制、跳躍與依地形估算的水下海床；尚非完整物理引擎 |
| 世界區塊串流 | 85% | 可連續載入，仍需更平滑的多區塊銜接 |
| 效能管理 | 90% | 合併、實例化、畫質分級、視距裁切、即時 FPS／繪製量監測與低效能自動降級；進階 LOD 可再強化 |
| 離線備援 | 95% | 內建場景、提示、停止串流、手動恢復連線 |
| 行動裝置操作 | 70% | 有觸控方向鍵，仍需加入完整視角與衝刺控制 |
| 測試與相容性 | 70% | 正式建置通過，仍需更多瀏覽器和長時間測試 |

## 運作原理

### 1. 取得起始位置

進入首頁後，遊戲透過 `navigator.geolocation` 要求玩家位置。玩家也可以手動修改緯度與經度。按下「進入 3D 世界」後，前端同時要求地圖與高程資料。

### 2. 地圖資料轉換

伺服器端 `/api/osm` 將座標送到 Overpass API，查詢中心 500 公尺附近的：

- 建築 `building`
- 道路與步道 `highway`
- 水域 `natural=water`、`waterway=riverbank`
- 森林、草地、公園
- 鐵路

前端把每個地理座標換算為以玩家座標為中心的公尺座標：

```text
x ≈ 經度差 × 111320 × cos(緯度)
z ≈ -緯度差 × 110540
```

建築輪廓使用 ExtrudeGeometry 向上擠出。若資料包含 `height` 就直接使用；否則以 `building:levels × 3.1m` 估算，沒有高度資料時使用預設高度。

道路、鐵路和橋梁以沿線段排列的窄 BoxGeometry 表示；水域、公園及草地使用多邊形 ShapeGeometry。

### 3. 地形高程

伺服器端 `/api/elevation` 在中心周圍 1 公里範圍建立 9×9 採樣點，從 Open-Meteo Elevation API 取得 Copernicus GLO-90 高程。前端以雙線性插值計算任意位置高度，並把中心高度歸零，形成相對起伏地形。

### 4. 玩家與碰撞

透明人由頭、身體、手臂與腿的幾何組成，比例接近真人。移動時角色位置依每幀經過時間更新，因此不同幀率下速度大致一致。

附近建築會建立碰撞盒。玩家不能由外部走進建築；如果區塊切換後角色已位於建築內，系統允許角色向外移動，避免永久卡住。出生時也會搜尋附近沒有建築和水域的位置。

### 5. 水域

玩家進入 OSM 水域多邊形後：

- 行走速度降低。
- 垂直速度持續受到小幅向下作用力。
- 玩家緩慢下降直到預設海床高度。
- 按 Space 可向上游。
- 相機進入水下後切換成偏藍綠色霧。

### 6. 區塊串流

玩家距離目前區塊中心超過約 220 公尺時，系統計算新的地理中心，載入下一區塊的地圖與高程。載入期間暫停移動並顯示遮罩。完成後玩家局部座標回到原點附近，以降低 WebGL 大座標的浮點誤差。

### 7. 物件數量與效能

WebGL 沒有單一固定的「最多物件數」，真正限制通常是 draw calls、三角形數量、記憶體、陰影與裝置 GPU。因此本專案採用：

- 將相同材質的建築、道路、土地、水域及鐵路幾何合併。
- 樹木使用 InstancedMesh。
- 各畫質模式限制地形細分、建築、道路、樹木、像素比與陰影。
- 各畫質模式也使用不同的地物納入半徑與相機最遠視距，避免省電裝置處理看不到的遠方資料。
- HUD 即時顯示 FPS、繪製呼叫與三角形數；持續低於安全幀率時自動調降一級畫質。
- API 最多回傳 1200 個地物，前端再依效能預算取用。

### 8. 離線模式

若線上 OSM 地圖請求失敗，遊戲不會用玩家座標生成虛構場景，而會：

1. 載入網站內建的淡水漁人碼頭固定資料。
2. 將目前座標切換為 `25.18339, 121.41147`。
3. 顯示「離線狀態」與「不與經緯度連動」。
4. 停止下一區塊的線上串流。
5. 保留玩家最初要求的座標。
6. 允許玩家按「重試原始座標」恢復線上場景。

## 遊戲使用方法

### 開始

1. 開啟遊戲網站。
2. 允許瀏覽器取得位置，或手動輸入緯度、經度。
3. 按下「進入 3D 世界」。
4. 等待地圖與高程載入完成。

### 鍵盤與滑鼠

| 操作 | 功能 |
| --- | --- |
| `W`／`↑` | 前進 |
| `S`／`↓` | 後退 |
| `A` | 向左平移 |
| `D` | 向右平移 |
| `Shift + WASD` | 加速移動 |
| `Space` | 地面跳躍／水中向上游 |
| 按住滑鼠拖曳 | 自由環視 |
| `←`／`→` | 鍵盤旋轉視角 |

左側面板可以切換第一人稱／背後跟隨，以及省電／平衡／高畫質。畫面右上是指南針，右下顯示資料、區塊及水下深度狀態。

### 離線狀態

若看到「離線狀態」，目前正在淡水漁人碼頭的內建模擬場景中，畫面座標不代表原先輸入地點。網路恢復後可按「重試原始座標」。

## 畫質模式

| 模式 | 適合情境 | 主要差異 |
| --- | --- | --- |
| 省電 | 手機、整合顯示晶片、低耗電 | 較低像素比、地形細分和物件預算，關閉陰影 |
| 平衡 | 一般電腦 | 中等像素比、物件數與陰影 |
| 高畫質 | 獨立顯示卡 | 更高地形細分、物件預算、像素比與陰影 |

## 技術架構

- React 19
- Next.js 16 相容的 vinext 執行環境
- TypeScript
- Three.js
- OpenStreetMap／Overpass API
- Open-Meteo Elevation API／Copernicus GLO-90
- Cloudflare Workers 相容部署
- OpenAI Sites Hosting
- GitHub Pages 靜態前端
- Cloudflare Worker 公開地理 API（部署準備中）

主要檔案：

```text
app/page.tsx                         遊戲 UI、Three.js 場景與互動邏輯
app/globals.css                      首頁、HUD、指南針、離線提示與行動版樣式
app/api/osm/route.ts                 OSM／Overpass 地圖代理
app/api/elevation/route.ts           高程網格代理
public/offline/fishermans-wharf.json 淡水漁人碼頭內建備援場景
.openai/hosting.json                 Sites 部署設定
github-pages/                        GitHub Pages 專用靜態入口
vite.pages.config.ts                 GitHub Pages 靜態建置設定
.github/workflows/deploy-pages.yml   GitHub Pages 自動部署流程
geo-worker/index.ts                  公開 OSM／高程代理 Worker
wrangler.geo.jsonc                   公開 Worker 部署設定
```

## GitHub Pages 與公開地理 API

這一節記錄 GitHub Pages 上線後遇到的問題、架構決策、目前進度與接手方式。即使日後更換開發者，也應先閱讀本節再調整部署。

### 為什麼 GitHub Pages 一開始只能進入淡水漁人碼頭

GitHub Pages 只能提供靜態 HTML、CSS、JavaScript 和 JSON，不能執行 Next.js API 路由。為了保留任意經緯度功能，第一版 GitHub Pages 被設定為呼叫既有站點：

```text
GitHub Pages
  ├─ /api/osm       → walk-the-earth-tw.funsteam99.chatgpt.site
  └─ /api/elevation → walk-the-earth-tw.funsteam99.chatgpt.site
```

但既有 Sites 站點需要登入。從 GitHub Pages 發出的跨網域請求實測結果為：

```text
/api/osm       → HTTP 401 Unauthorized
/api/elevation → HTTP 401 Unauthorized
```

前端收到失敗結果後會正確啟動備援邏輯，因此玩家永遠被帶到淡水漁人碼頭。這不是 Three.js、GitHub Pages 或離線地圖故障，而是 API 的存取權限造成。

### 為什麼需要公開 API

靜態前端仍然可以顯示真實動態地圖，只要有一個不要求玩家登入的公開 API。公開 API 的工作是：

1. 接收玩家座標。
2. 驗證緯度與經度。
3. 代替瀏覽器呼叫 Overpass API。
4. 代替瀏覽器呼叫 Open-Meteo Elevation API。
5. 回傳 CORS 標頭，允許 GitHub Pages 使用。
6. 限制地物數量並設定逾時與快取。

因此最終資料流規畫為：

```text
玩家
  ↓
GitHub Pages 靜態 3D 前端
  ↓
公開 Cloudflare Worker
  ├─ Overpass API → OpenStreetMap 地物
  └─ Open-Meteo   → Copernicus GLO-90 高程

任何一段失敗
  ↓
內建淡水漁人碼頭備援場景
```

Cloudflare 不是唯一選擇，也可以改用 Vercel Functions、Netlify Functions、自建伺服器或其他公開 Serverless 平台。選擇 Cloudflare Worker 的原因是免費額度、全球節點、CORS 控制及現有 Wrangler 相容性。

### GitHub 發布狀態

| 項目 | 狀態 |
| --- | --- |
| 原始碼儲存庫 | 已完成：`https://github.com/funsteam99/walk-the-earth` |
| GitHub Pages | 已完成：`https://funsteam99.github.io/walk-the-earth/` |
| Pages 自動部署 | 已完成；推送 `main` 後由 GitHub Actions 發布 |
| 靜態 3D 遊戲 | 已完成 |
| 內建離線地圖 | 已完成 |
| GitHub Pages 真實地圖 | 尚未完成；等待公開 Worker 上線 |

### Cloudflare 操作紀錄

已完成：

- Cloudflare 帳號登入與 Wrangler OAuth 授權。
- GitHub 帳號 `funsteam99` 已連接 Cloudflare。
- Cloudflare 建立頁已選擇 `funsteam99/walk-the-earth`。
- 公開 Worker 程式已寫入 `geo-worker/index.ts`。
- Worker 設定已寫入 `wrangler.geo.jsonc`。
- 以上兩個檔案已推送到 GitHub。
- Worker 名稱預定為 `walk-the-earth-geo-api`。

遇到的問題：

- Cloudflare Worker 已公開部署，GitHub Pages 可透過它取得真實地圖與高度資料。
- 公開 API：`https://walk-the-earth-geo-api.funsteam99.workers.dev`
- 曾嘗試使用 `geo-api.shezi.org.tw`，但 `shezi.org.tw` 不在目前 Cloudflare 帳號的 DNS Zone 中，因此 Cloudflare 拒絕建立 Custom Domain。
- 將 GitHub 連接到 Cloudflare 本身沒有錯，但必須以 Worker 設定部署，不能把它當成另一個純 Pages 網站。

### Cloudflare 建立頁正確設定

目前 Cloudflare 新版畫面標題為 `Set up your application`。正確欄位如下：

| 欄位 | 設定值 |
| --- | --- |
| Repository | `funsteam99/walk-the-earth` |
| Project name | `walk-the-earth-geo-api` |
| Build command | 留空 |
| Deploy command | `npx wrangler deploy --config wrangler.geo.jsonc` |
| Production branch | `main` |
| Builds for non-production branches | 可關閉，非必要 |

按下 Cloudflare 的 `Deploy` 會建立外部服務，應確認上述欄位後再執行。

### 目前精確停留點

截至本文件更新時：

> Worker 程式與設定已在 GitHub，但 Cloudflare 的 Deploy 尚未確認完成，GitHub Pages 仍指向需要登入的舊 API，所以目前仍會進入淡水漁人碼頭模擬模式。

接下來應依序完成：

1. 在 Cloudflare `Set up your application` 頁填入上表設定。
2. 按下 `Deploy`。
3. 等待 Cloudflare 顯示公開 Worker 網址，格式通常為：

   ```text
   https://walk-the-earth-geo-api.funsteam99.workers.dev
   ```

4. 測試以下三個網址：

   ```text
   <Worker URL>/health
   <Worker URL>/api/osm?lat=25.033&lon=121.5654
   <Worker URL>/api/elevation?lat=25.033&lon=121.5654
   ```

5. `app/page.tsx` 的 `hostedApiOrigin` 已改成上述 Worker URL。
6. 執行 `npm run build:pages`。
7. 提交並推送 `main`，等待 GitHub Actions 完成。
8. 在 GitHub Pages 輸入非淡水座標，確認顯示「已載入 N 個地物」，而不是「離線模擬模式」。

### 公開 Worker 的安全範圍

Worker 只提供唯讀 GET／OPTIONS 端點，不包含帳號、資料庫或寫入功能。目前程式包含：

- 經緯度格式與範圍驗證。
- Overpass 30 秒逾時。
- Open-Meteo 20 秒逾時。
- OSM 回傳最多 1200 個地物。
- 允許 GitHub Pages 與既有自訂 Pages 網域的 CORS。
- 地圖及高程快取標頭。
- `/health` 健康檢查端點。

公開端點仍可能被他人呼叫。若流量增加，後續應加入 Cloudflare Rate Limiting、快取 API、來源限制和監控。

### 故障排查

| 現象 | 可能原因 | 處理方式 |
| --- | --- | --- |
| 永遠進入漁人碼頭 | API 回傳 401、CORS 或 Worker 未部署 | 用瀏覽器開啟 `/health`，再檢查 `hostedApiOrigin` |
| Cloudflare 顯示找不到 `wrangler.geo.jsonc` | GitHub 尚未同步或 Root directory 錯誤 | 確認 `main` 分支檔案存在，Root directory 使用 `/` |
| `workers.dev` 尚未註冊 | 帳號第一次使用 Workers | 從 Workers & Pages 建立／部署第一個 Worker |
| Custom Domain 找不到 Zone | 網域 DNS 不在該 Cloudflare 帳號 | 使用 `workers.dev`，或先把網域加入 Cloudflare |
| Overpass 回傳 504 | 上游服務繁忙 | 稍後重試，遊戲會使用離線場景 |
| GitHub Pages 更新後仍是舊版 | Actions 尚未完成或瀏覽器快取 | 查看 Actions，成功後強制重新整理 |

## 本機執行

需求：Node.js 22.13 或更新版本。

```bash
npm install
npm run dev
```

正式建置：

```bash
npm run build
```

## 資料來源與限制

- 地圖：© OpenStreetMap contributors，透過 Overpass API 查詢。
- 高程：Open-Meteo Elevation API，資料來源為 Copernicus GLO-90。
- OSM 地物可能缺少高度、樓層、完整輪廓或水域標記，遊戲會使用合理預設值。
- 高程採樣與建築模型均經簡化，不適用於導航、工程、測量或安全判斷。
- 海床目前是遊戲化的預設深度，不是精確海洋測深資料。
- 淡水漁人碼頭離線場景為固定的輕量備援快照，細節少於線上場景。

## 待完成路線圖

### 優先

- 更平滑的相鄰區塊交接，避免地物突然出現。
- 建築多邊形碰撞，取代部分較寬鬆的包圍盒。
- 完整行動裝置視角、加速、跳躍和游泳控制。
- 更長時間的移動、重連與記憶體壓力測試。

### 後續

- 依距離切換 LOD，加入遠景輪廓和更積極的視錐剔除。
- 多個相鄰區塊同時保留，減少切換感。
- 更準確的橋梁、隧道、海岸線和水深。
- 地標名稱、距離提示與簡易導航。
- 天候、日夜和環境音效。
- 儲存探索位置、足跡與個人設定。

## 專案狀態

目前為實驗性 MVP。核心概念已可實際遊玩，下一階段重點是大型世界的平滑程度、行動裝置體驗、場景精度與長時間穩定性。
