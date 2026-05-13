



# 3. FastAPI Backend Setup

## Go to Backend Project

```bash
cd /var/www/fastapi
```

---

## Create Virtual Environment

```bash
python3 -m venv venv
```

---

## Activate Virtual Environment

```bash
source venv/bin/activate
```

---

## Install Requirements

```bash
pip install -r requirements.txt
```

---

## Run FastAPI Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

# 4. Create Systemd Service for FastAPI

## Create Service File

```bash
sudo nano /etc/systemd/system/fastapi.service
```

---

## Service Configuration

```ini
[Unit]
Description=FastAPI Application
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/fastapi
Environment="PATH=/var/www/fastapi/venv/bin"
ExecStart=/var/www/fastapi/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## Reload Systemd

```bash
sudo systemctl daemon-reload
```

---

## Enable Service

```bash
sudo systemctl enable fastapi
```

---

## Start Service

```bash
sudo systemctl start fastapi
```

---

## Check Status

```bash
sudo systemctl status fastapi
```

---

# 5. Nginx Configuration

## Active Config File

```bash
nano /etc/nginx/sites-enabled/hita-fastapi
```

---

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name hotelmapping.innovatedemo.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name hotelmapping.innovatedemo.com;

    ssl_certificate /etc/letsencrypt/live/hotelmapping.innovatedemo.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hotelmapping.innovatedemo.com/privkey.pem;

    # Serve React build
    root /var/www/react/build;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

# 6. Test Nginx Configuration

```bash
sudo nginx -t
```

---

# 7. Restart Nginx

```bash
sudo systemctl restart nginx
```

---

# 8. SSL Setup with Certbot

## Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## Generate SSL Certificate

```bash
sudo certbot --nginx -d hotelmapping.innovatedemo.com
```

---

# 9. Firewall Setup

## Allow Nginx

```bash
sudo ufw allow 'Nginx Full'
```

---

## Enable Firewall

```bash
sudo ufw enable
```

---

# 10. Useful Commands

## Restart FastAPI

```bash
sudo systemctl restart fastapi
```

---

## Restart Nginx

```bash
sudo systemctl restart nginx
```

---

## Check Nginx Status

```bash
sudo systemctl status nginx
```

---

## Check FastAPI Logs

```bash
journalctl -u fastapi -f
```

---

## Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
```



---

## Restart Backend

```bash
sudo systemctl restart fastapi
```

---

## Restart Nginx

```bash
sudo systemctl restart nginx
```
