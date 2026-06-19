from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas

# --- PRODUCT CRUD ---

def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).order_by(models.Product.id.desc()).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    # Verify SKU uniqueness
    existing_product = get_product_by_sku(db, product.sku)
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Product with SKU '{product.sku}' already exists."
        )
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity=product.quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    # Check SKU uniqueness if it's changing
    if product_update.sku is not None and product_update.sku != db_product.sku:
        existing = get_product_by_sku(db, product_update.sku)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with SKU '{product_update.sku}' already exists."
            )
    
    # Apply changes
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        return None
    
    # Relational integrity check: is this product ordered?
    ordered = db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).first()
    if ordered:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete product '{db_product.name}' as it is referenced in one or more orders. Delete the associated orders first."
        )
        
    db.delete(db_product)
    db.commit()
    return db_product


# --- CUSTOMER CRUD ---

def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).order_by(models.Customer.id.desc()).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    # Verify email uniqueness
    existing_customer = get_customer_by_email(db, customer.email)
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Customer with email '{customer.email}' already exists."
        )
    
    db_customer = models.Customer(
        name=customer.name,
        email=customer.email,
        phone=customer.phone
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        return None
    
    # Relational integrity check: does this customer have orders?
    ordered = db.query(models.Order).filter(models.Order.customer_id == customer_id).first()
    if ordered:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete customer '{db_customer.name}' as they have active orders. Cancel/delete the orders first."
        )
        
    db.delete(db_customer)
    db.commit()
    return db_customer


# --- ORDER CRUD ---

def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).order_by(models.Order.id.desc()).offset(skip).limit(limit).all()

def create_order(db: Session, order_data: schemas.OrderCreate):
    # 1. Verify Customer exists
    customer = get_customer(db, order_data.customer_id)
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} does not exist."
        )
    
    # 2. Start building Order and tracking items inside a single database transaction
    total_amount = 0.0
    order_items_to_create = []
    
    # Use select ... for update to prevent race conditions during inventory updates
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} does not exist."
            )
            
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient inventory for product '{product.name}' (SKU: {product.sku}). Requested: {item.quantity}, Available: {product.quantity}."
            )
            
        # Deduct stock
        product.quantity -= item.quantity
        
        # Calculate pricing details
        item_total = product.price * item.quantity
        total_amount += item_total
        
        # Prepare OrderItem database entity
        order_item = models.OrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price_at_order=product.price
        )
        order_items_to_create.append(order_item)
        
    # 3. Create core Order entity
    db_order = models.Order(
        customer_id=customer.id,
        total_amount=total_amount
    )
    db.add(db_order)
    db.flush() # Flushes order to DB so it generates an order.id for foreign keys
    
    # 4. Attach generated order.id to items and add them
    for order_item in order_items_to_create:
        order_item.order_id = db_order.id
        db.add(order_item)
        
    db.commit()
    db.refresh(db_order)
    return db_order

def delete_order(db: Session, order_id: int):
    # Select order with lock if editing
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        return None
        
    # As agreed in implementation plan, restore inventory stock on order cancellation/deletion
    for item in db_order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
        if product:
            product.quantity += item.quantity
            
    db.delete(db_order)
    db.commit()
    return db_order


# --- DASHBOARD STATS ---

def get_dashboard_stats(db: Session):
    total_products = db.query(models.Product).count()
    total_customers = db.query(models.Customer).count()
    total_orders = db.query(models.Order).count()
    
    # Low stock threshold is configured to <= 5 items in inventory
    low_stock_products = db.query(models.Product).filter(models.Product.quantity <= 5).all()
    low_stock_count = len(low_stock_products)
    
    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": low_stock_count,
        "low_stock_products": low_stock_products
    }
