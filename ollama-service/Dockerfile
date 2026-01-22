# Ollama 服务 Dockerfile
# 用于在 Railway 上部署独立的 Ollama 服务

FROM ollama/ollama:latest

# Railway 公網會把流量轉發到容器的 $PORT（通常是 8080）
# 我們會在 startCommand 用 OLLAMA_HOST 綁定到 $PORT
EXPOSE 8080

# Bootstrap model + serve (so /api/generate works after deploy/restart)
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]

