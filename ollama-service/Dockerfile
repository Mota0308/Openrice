# Ollama 服务 Dockerfile
# 用于在 Railway 上部署独立的 Ollama 服务

FROM ollama/ollama:latest

# 暴露 Ollama 默认端口
EXPOSE 11434

# Ollama 默认启动命令
# Railway 会自动运行 ollama serve
CMD ["ollama", "serve"]

