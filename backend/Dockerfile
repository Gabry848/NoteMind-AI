# filepath: /home/gabry848/Scrivania/to-do app/Server/Dockerfile
FROM python:3.13

WORKDIR /app

# Copia il file delle dipendenze e installale
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copia il resto dell'applicazione
COPY . .

# Esponi la porta usata dall'applicazione
EXPOSE 8000

# Avvia l'app come se eseguissimo `python main.   py`
CMD ["python", "main.py"]
