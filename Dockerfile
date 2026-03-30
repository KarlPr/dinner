# ── Stage 1: Build frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend/ ./
RUN dotnet publish Dinner-Server/Dinner-Server.csproj \
    -c Release \
    -o /app/publish

# ── Stage 3: Runtime ────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=backend-build /app/publish ./
COPY --from=frontend-build /app/frontend/dist ./wwwroot/

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

VOLUME /app/data

ENTRYPOINT ["dotnet", "Dinner-Server.dll"]
