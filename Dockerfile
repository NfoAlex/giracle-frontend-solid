# ----------------------------------
# ステージ1: ビルド環境 (Builder)
# ----------------------------------
# Node.jsの軽量なalpineイメージをベースにする
FROM node:24-alpine AS builder

# 作業ディレクトリを設定
WORKDIR /APP

# package.jsonとpackage-lock.jsonを先にコピーし、依存関係をインストール
# これにより、ソースコードの変更だけでは `npm install` が再実行されなくなる
COPY package*.json ./
RUN npm install

# アプリケーションのソースコードを全てコピー
COPY . .

# Viteでアプリケーションをビルド
# 'dist'ディレクトリに静的ファイルが生成される
RUN npm run build


# ----------------------------------
# ステージ2: 本番環境 (Production)
# ----------------------------------
# Nginxの軽量なalpineイメージをベースにする
FROM nginx:stable-alpine

# ビルドステージ(builder)から、ビルド済みの静的ファイルのみをNginxの公開ディレクトリにコピー
# /app/dist の中身が /usr/share/nginx/html にコピーされる
COPY --from=builder /app/dist /usr/share/nginx/html

# カスタムNginx設定ファイルをコンテナ内の設定ディレクトリにコピー
# これでデフォルト設定が上書きされる
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# コンテナが3000番ポートを公開することを明示
EXPOSE 3000

# Nginxをフォアグラウンドで実行（コンテナを起動し続けるため）
CMD ["nginx", "-g", "daemon off;"]