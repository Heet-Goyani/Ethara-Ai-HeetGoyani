# Ethara.io - Containerized Inventory & Order Management System

A production-ready, fully containerized full-stack application for managing products, customers, and orders. Features automated transactional inventory management, stock verification, and dynamic total sales calculations. 

Built with a modern **FastAPI (Python)** backend, a stunning **React (Vite)** frontend using custom Vanilla CSS **glassmorphism**, and a persistent **PostgreSQL** database.

---

## 🚀 Quick Start with Docker Compose

Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.

1. **Clone the Repository** and navigate to the project directory.
2. **Start the Application Stack**:
   ```bash
   docker-compose up --build
   ```
3. **Access Services**:
   - **Frontend UI Panel**: [http://localhost:8080](http://localhost:8080)
   - **Backend REST API REST**: [http://localhost:8000](http://localhost:8000)
   - **Interactive API Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Lucide-React, Axios | Modular, reactive glassmorphic UI styled with vanilla CSS. |
| **Backend** | Python 3.11, FastAPI, Pydantic v2 | High-performance API with auto-generated documentation. |
| **Database** | PostgreSQL 15 | Relational ACID database with check constraints. |
| **ORM** | SQLAlchemy 2.0 | Advanced relational database mapping. |
| **Containerization** | Docker, Docker Compose | Multi-stage slim Docker images, Nginx server. |
| **Deployment** | Render, Vercel | Blueprint scripts ready for continuous deployment. |

---

## 📑 Core Features & API Specifications

### 📦 1. Product Management
- **POST `/products`**: Add a new product to inventory.
- **GET `/products`**: List all products.
- **GET `/products/{id}`**: Fetch specific product details.
- **PUT `/products/{id}`**: Edit details of a product.
- **DELETE `/products/{id}`**: Deletes a product (blocked if the product exists in historical orders to protect relational integrity).
- *Fields*: `name`, `sku` (Unique), `price` (Non-negative), `quantity` (Non-negative).

### 👥 2. Customer Management
- **POST `/customers`**: Register a customer profile.
- **GET `/customers`**: List all registered customers.
- **GET `/customers/{id}`**: Fetch details of a customer.
- **DELETE `/customers/{id}`**: Delete customer profile (blocked if customer has active orders).
- *Fields*: `name`, `email` (Unique, validated format), `phone`.

### 🛒 3. Order Management & Checkout
- **POST `/orders`**: Place a multi-item order. Initiates database-level transaction lock (`SELECT FOR UPDATE`), checks stock, decrements inventory, and recordssnapshot pricing.
- **GET `/orders`**: List order history.
- **GET `/orders/{id}`**: Inspect order invoice line-items.
- **DELETE `/orders/{id}`**: Cancels/Deletes order and **replenishes/restores** inventory quantities.
- *Fields*: `customer_id`, list of `items` (`product_id`, `quantity`). Auto-calculates totals.

### 📊 4. Management Dashboard
- **GET `/dashboard/stats`**: Aggregates business analytics: total counts, alerts, and products with stock levels `<= 5`.

---

## 🛡️ Business Logic Rules
1. **Uniqueness**: Product `SKU` and Customer `email` are enforced unique at the database schema layer and API level.
2. **Bounds**: Product prices and quantities are strictly check-constrained `(>= 0)` in SQL to prevent negative inventory anomalies.
3. **Transaction Safety**: Checks and stock adjustments are wrapped in an atomic SQL transaction. If a client attempts to buy more than what is in stock, the transaction immediately rolls back, returning a friendly `400 Bad Request`.
4. **Order Deletion**: Deleting an order auto-replenishes the products back to the warehouse inventory.

---

## 🧪 Automated API Testing

A complete automated API test suite is included at the root of the project to test all business logic validation rules.

**To run the tests:**
1. Ensure the backend server is running (either locally or inside Docker).
2. Execute the verification script:
   ```bash
   python verify_apis.py
   ```

*The script verifies: customer email uniqueness, SKU uniqueness, negative quantity validation, insufficient stock order rejection, successful order stock deduction, and order cancellation stock recovery.*

---

## 💻 Local Development (without Docker)

### Backend Development
1. Navigate to directory:
   ```bash
   cd backend
   ```
2. Create and active virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Development
1. Navigate to directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Boot development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Production Deployment

### 1. Backend Deployed on Render (Free tier)
- Render will automatically parse the [render.yaml](render.yaml) file at the root.
- Simply link your Github repository to Render, create a new Blueprint Instance, and it will deploy your PostgreSQL DB and FastAPI API.

### 2. Frontend Deployed on Vercel / Netlify
- To deploy the frontend, you can deploy it as a static site.
- Configure `VITE_API_URL` environment variable during build to point to your live backend endpoint.
- For Vercel, a redirection script is configured in Nginx, but you can add a `vercel.json` if using custom page routers:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```
