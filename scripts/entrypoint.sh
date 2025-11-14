#!/bin/bash
set -e

echo "🔍 Verificando conexão com PostgreSQL em $DB_HOST:$DB_PORT..."

# Espera até o Postgres aceitar conexões
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" >/dev/null 2>&1; do
  echo "Aguardando o PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Cria o banco, se não existir
echo "📦 Verificando existência do banco '$DB_NAME'..."
if ! PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  echo "🧩 Criando banco '$DB_NAME'..."
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE \"$DB_NAME\""
else
  echo "📚 Banco '$DB_NAME' já existe."
fi

# Executa migrations
echo "🛠️ Executando migrations..."
npm run migration:run

# Inicia a aplicação
echo "🚀 Iniciando servidor NestJS..."
exec npm run start:dev
