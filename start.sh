#!/bin/bash

# NoteMind AI - Quick Start Script
# Questo script avvia l'applicazione con Docker Compose

set -e

echo "=============================================="
echo "🚀 NoteMind AI - Quick Start"
echo "=============================================="
echo ""

# Controlla se Docker è installato
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installato!"
    echo "   Installa Docker da: https://docs.docker.com/get-docker/"
    exit 1
fi

# Controlla se docker-compose è installato
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose non installato!"
    echo "   Installa Docker Compose da: https://docs.docker.com/compose/install/"
    exit 1
fi

# Controlla se esiste file .env
if [ ! -f .env ]; then
    echo "⚠️  File .env non trovato!"
    echo "   Creando .env da .env.example..."

    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ File .env creato!"
        echo ""
        echo "⚠️  IMPORTANTE: Configura le seguenti variabili in .env:"
        echo "   - GEMINI_API_KEY (obbligatorio)"
        echo "   - SECRET_KEY (consigliato cambiarla)"
        echo ""
        echo "Premi INVIO per continuare o CTRL+C per uscire..."
        read
    else
        echo "❌ .env.example non trovato!"
        echo "   Crea manualmente un file .env con le variabili necessarie."
        exit 1
    fi
fi

# Verifica GEMINI_API_KEY
if ! grep -q "GEMINI_API_KEY=.*[a-zA-Z0-9]" .env 2>/dev/null; then
    echo "⚠️  GEMINI_API_KEY non configurata in .env!"
    echo "   L'applicazione non funzionerà senza una API key valida."
    echo ""
    echo "Vuoi continuare comunque? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        exit 0
    fi
fi

echo ""
echo "📦 Building containers..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Controlla health del backend
echo "🔍 Checking backend health..."
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi

    if [ $i -eq 30 ]; then
        echo "❌ Backend health check failed after 30 seconds"
        echo "   Check logs with: docker-compose logs backend"
        exit 1
    fi

    sleep 1
done

echo ""
echo "=============================================="
echo "✅ NoteMind AI is running!"
echo "=============================================="
echo ""
echo "📍 Endpoints:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📊 Useful commands:"
echo "   Logs:       docker-compose logs -f"
echo "   Stop:       docker-compose down"
echo "   Restart:    docker-compose restart"
echo "   Rebuild:    docker-compose up --build -d"
echo ""
echo "🎉 Happy coding!"
echo ""
