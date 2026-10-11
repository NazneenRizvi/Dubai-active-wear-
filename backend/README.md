# FITNESS JUNKIES — Backend API (FastAPI + SQLAlchemy)

Production-ready REST API for the FITNESS JUNKIES athletic apparel e-commerce platform.

## Architecture

- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite (default zero-config) or PostgreSQL (production)
- **Validation**: Pydantic v2
- **Auth**: JWT (OAuth2 Password Bearer) with bcrypt password hashing

```
/backend
├── app/
│   ├── core/
│   │   ├── config.py         # App configuration & CORS settings
│   │   ├── database.py       # SQLAlchemy engine & get_db dependency
│   │   └── security.py       # JWT creation, decoding & bcrypt hashing
│   ├── models/
│   │   ├── user.py           # User model
│   │   ├── product.py        # Activewear product model
│   │   ├── cart.py           # Cart item model
│   │   └── order.py          # Orders & itemized receipt model
│   ├── schemas/
│   │   ├── user.py           # Registration & login schemas
│   │   ├── product.py        # Product schemas
│   │   ├── cart.py           # Cart schemas
│   │   └── order.py          # Checkout & order tracking schemas
│   ├── routers/
│   │   ├── auth.py           # POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
│   │   ├── products.py       # GET /api/products, GET /api/products/{id}, POST /api/products
│   │   ├── cart.py           # GET, POST, PUT, DELETE /api/cart
│   │   └── orders.py         # POST /api/checkout, GET /api/orders/{order_number}
│   └── main.py               # FastAPI application entry point with CORS
├── seed.py                   # Populates realistic activewear catalog matching reference
├── requirements.txt
└── Dockerfile
```

---

## Quick Start (Local Development)

1. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   .\venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Seed Database with Reference Catalog**:
   ```bash
   python seed.py
   ```

4. **Run the FastAPI server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

5. **Explore Swagger / OpenAPI interactive docs**:
   - Interactive docs: `http://localhost:8000/docs`
   - Redoc: `http://localhost:8000/redoc`

---

## Deployment to Hostinger VPS / Ubuntu Server

1. **Connect via SSH to your Hostinger VPS**:
   ```bash
   ssh root@your-hostinger-vps-ip
   ```

2. **Clone your repository & navigate to `/backend`**:
   ```bash
   git clone <your-repo-url>
   cd <your-repo>/backend
   ```

3. **Install Docker & Docker Compose (Recommended)**:
   ```bash
   docker build -t fitness-junkies-backend .
   docker run -d -p 8000:8000 --name fj-api --restart always fitness-junkies-backend
   ```

4. **Or run using systemd + Nginx**:
   Create `/etc/systemd/system/fitnessjunkies.service`:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Fitness Junkies FastAPI
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/var/www/fitness-junkies/backend
   Environment="PATH=/var/www/fitness-junkies/backend/venv/bin"
   ExecStart=/var/www/fitness-junkies/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4

   [Install]
   WantedBy=multi-user.target
   ```
   Enable and start:
   ```bash
   systemctl enable fitnessjunkies
   systemctl start fitnessjunkies
   ```

5. **Nginx Reverse Proxy Configuration**:
   ```nginx
   server {
       server_name api.fitnessjunkies.net;

       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

---

## Deployment to Vercel (Frontend & Serverless Backend)

1. For Vercel frontend:
   Deploy the repository root directly to Vercel. Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `https://api.fitnessjunkies.net`).
2. Alternatively, Vercel supports Python serverless functions via `api/index.py` pointing to `app.main:app`.
