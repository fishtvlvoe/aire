# 三段式 AI 房產文件系統 — 安裝說明

## 安裝步驟（共 4 步）

### 步驟 1：安裝 Docker Desktop

前往 [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) 下載並安裝。

安裝完成後，打開 Docker Desktop，等待右上角出現鯨魚圖示（綠燈表示正常運行）。

---

### 步驟 2：下載系統檔案

向建安不動產索取 `three-ai.zip`，解壓縮到任意資料夾，例如：

```
Documents/three-ai/
```

---

### 步驟 3：設定環境變數

在 `three-ai/` 資料夾內找到 `.env.example`，複製並重新命名為 `.env`：

```
cp .env.example .env
```

用文字編輯器打開 `.env`，確認內容如下（不需修改）：

```
DB_PATH=./data/listings.db
PORT=3000
```

---

### 步驟 4：啟動系統

打開終端機，進入 `three-ai/` 資料夾後執行：

```
docker compose up
```

首次啟動約需 3-5 分鐘（系統建置中）。看到以下訊息即代表成功：

```
Container three-ai-app-1 Started
```

打開瀏覽器，前往 [http://localhost:3000](http://localhost:3000) 開始使用。

---

## 日常使用

- **啟動系統：** `docker compose up`
- **關閉系統：** `Ctrl + C` 或 `docker compose down`
- **資料存放位置：** `three-ai/data/listings.db`（SQLite 資料庫，可備份）

---

## 常見問題

**Q：瀏覽器打開是空白頁？**
等待 10 秒後重新整理，系統啟動需要一點時間。

**Q：出現「port 3000 already in use」錯誤？**
有其他程式佔用 3000 埠。執行 `docker compose down` 後再重新啟動。

**Q：資料不見了？**
確認 `three-ai/data/` 資料夾存在且有 `listings.db` 檔案。不要刪除此資料夾。
