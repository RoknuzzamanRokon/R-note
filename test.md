# FastAPI + React + Nginx Deployment Guide

## Project Overview

This setup includes:

* React Frontend
* FastAPI Backend
* Nginx Reverse Proxy
* SSL with Let's Encrypt
* Ubuntu Server Deployment


---

# 1. Install Required Packages

## Update Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Install Nginx

```bash
sudo apt install nginx -y
```

---

## Install Python & Virtual Environment

```bash
sudo apt install python3 python3-pip python3-venv -y
```

---

## Install Node.js

```bash
sudo apt install nodejs npm -y
```

---

# 11. Deployment Flow

## Update React Frontend

---


# 2. React Frontend Build

## Go to React Project

```bash
cd /var/www/ScirptEngine/JavaScript-Application/Mapping-Check
```

---

## Install Dependencies

```bash
npm install
```

---

## Create Production Build

```bash
npm run build
```

Build files will be generated inside:

```bash
/var/www/ScirptEngine/JavaScript-Application/Mapping-Check/build
```

---


```bash
cd /var/www/ScirptEngine/JavaScript-Application/Mapping-Check
npm run build
```


---

# 12. Common Errors

## 502 Bad Gateway

### Fix

Check FastAPI service:

```bash
sudo systemctl status fastapi
```

---

## Permission Denied

### Fix

```bash
sudo chown -R www-data:www-data /var/www/react/build
```

---

## Port Already in Use

### Fix

```bash
sudo lsof -i :8000
```

Kill process:

```bash
sudo kill -9 PID
```

---

# Final URLs

## Frontend

```bash
https://hotelmapping.innovatedemo.com
```

---

## API

```bash
https://hotelmapping.innovatedemo.com/api/
```
