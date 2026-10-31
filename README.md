# MC 资源下载站

GitHub Pages 只托管网页（index.html），文件存在 Cloudflare R2，互不干扰。

## 部署顺序

1. Cloudflare → R2 建桶（免费 10GB）
2. Cloudflare → Workers 建 Worker，代码粘 worker.js
   Worker 设置 → Bindings → 绑 R2 桶，变量名写 `BUCKET`
   记下 Worker 地址，如 https://mc-files.xxx.workers.dev
3. 打开 index.html，把第 3 行 OWNER 改成你 GitHub 用户名，
   第 4 行 API 改成上面那个 Worker 地址
4. 把 index.html 推到 用户名.github.io/mc-plugins/，开 Pages 即可

## 想换成"文件放自己电脑"

不想用 R2 的话，用 local-server.js：装 `npm i express multer` 后 `node local-server.js`，
把 index.html 里的 API 改成 `http://你的电脑IP:3000` 即可（只内网可用）。

## 注意
- 现在谁知道地址谁都能传。要锁：跟作者要"URL 暗号版"。
- R2 单文件无上限，整合包随便大。
