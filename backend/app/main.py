from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from . import models, schemas, crud
from .database import engine, Base, get_db
from .config import settings

# Initialize database tables on application start
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for the Inventory & Order Management System",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["General"])
def read_root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }


# --- DASHBOARD ENDPOINT ---

@app.get("/dashboard/stats", response_model=schemas.DashboardStats, tags=["Dashboard"])
def get_dashboard_statistics(db: Session = Depends(get_db)):
    """
    Retrieve summary metadata for the dashboard, including total products,
    customers, orders, and a listing of low-stock products.
    """
    try:
        stats = crud.get_dashboard_stats(db)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load dashboard metrics: {str(e)}"
        )


# --- PRODUCT ROUTER ---

@app.post("/products", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    """
    Create a new product. SKU code must be unique.
    """
    return crud.create_product(db=db, product=product)


@app.get("/products", response_model=List[schemas.ProductResponse], tags=["Products"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all products with pagination support.
    """
    return crud.get_products(db=db, skip=skip, limit=limit)


@app.get("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def read_product(product_id: int, db: Session = Depends(get_db)):
    """
    Retrieve details of a specific product by ID.
    """
    db_product = crud.get_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return db_product


@app.put("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def update_product(product_id: int, product_update: schemas.ProductUpdate, db: Session = Depends(get_db)):
    """
    Update details of an existing product.
    """
    db_product = crud.update_product(db=db, product_id=product_id, product_update=product_update)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return db_product


@app.delete("/products/{product_id}", response_model=schemas.ProductResponse, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Delete a product. Prevents deletion if the product is associated with orders.
    """
    db_product = crud.delete_product(db=db, product_id=product_id)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    return db_product


# --- CUSTOMER ROUTER ---

@app.post("/customers", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED, tags=["Customers"])
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """
    Register a new customer. Email address must be unique.
    """
    return crud.create_customer(db=db, customer=customer)


@app.get("/customers", response_model=List[schemas.CustomerResponse], tags=["Customers"])
def read_customers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all customers.
    """
    return crud.get_customers(db=db, skip=skip, limit=limit)


@app.get("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Retrieve customer details by ID.
    """
    db_customer = crud.get_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return db_customer


@app.delete("/customers/{customer_id}", response_model=schemas.CustomerResponse, tags=["Customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer record. Prevents deletion if the customer has existing orders.
    """
    db_customer = crud.delete_customer(db=db, customer_id=customer_id)
    if not db_customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return db_customer


# --- ORDER ROUTER ---

@app.post("/orders", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Create a new order. Automatically validates and decrements product inventory.
    Total order amount is calculated server-side.
    """
    return crud.create_order(db=db, order_data=order)


@app.get("/orders", response_model=List[schemas.OrderResponse], tags=["Orders"])
def read_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all orders.
    """
    return crud.get_orders(db=db, skip=skip, limit=limit)


@app.get("/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def read_order(order_id: int, db: Session = Depends(get_db)):
    """
    Retrieve detailed records of a specific order by ID.
    """
    db_order = crud.get_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return db_order


@app.delete("/orders/{order_id}", response_model=schemas.OrderResponse, tags=["Orders"])
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancel and delete an order. Product inventory is restored.
    """
    db_order = crud.delete_order(db=db, order_id=order_id)
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found"
        )
    return db_order
