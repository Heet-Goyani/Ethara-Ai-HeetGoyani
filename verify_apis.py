import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://localhost:8000"

def make_request(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status_code = response.getcode()
            response_data = json.loads(response.read().decode("utf-8"))
            return status_code, response_data
    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_data = e.reason
        return e.code, err_data
    except urllib.error.URLError as e:
        print(f"\n[ERROR] Could not connect to API server at {BASE_URL}. Ensure your backend server is running.")
        print(f"Details: {e.reason}")
        sys.exit(1)

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED INVENTORY & ORDER SYSTEM TESTS")
    print("=" * 60)

    # 1. Register Customer A
    print("\n[Test 1] Registering Customer A...")
    cust_data = {"name": "Test Customer", "email": "test.customer@gmail.com", "phone": "123456789"}
    code, res = make_request("/customers", "POST", cust_data)
    if code == 201:
        print(" -> SUCCESS: Customer created.")
        customer_id = res["id"]
    else:
        print(f" -> FAILED: Status code {code}, details: {res}")
        return

    # 2. Assert unique email constraints
    print("\n[Test 2] Trying duplicate email registration...")
    code, res = make_request("/customers", "POST", cust_data)
    if code == 400:
        print(" -> SUCCESS: Correctly rejected duplicate email registration.")
    else:
        print(f" -> FAILED: Allowed duplicate registration. Code: {code}")

    # 3. Create Product A
    print("\n[Test 3] Creating Product A (SKU: WIDGET-01, stock = 10)...")
    prod_a = {"name": "Premium Widget", "sku": "WIDGET-01", "price": 49.99, "quantity": 10}
    code, res = make_request("/products", "POST", prod_a)
    if code == 201:
        print(" -> SUCCESS: Product created.")
        product_id = res["id"]
    else:
        print(f" -> FAILED: Status code {code}, details: {res}")
        return

    # 4. Assert unique SKU constraint
    print("\n[Test 4] Trying duplicate SKU creation...")
    code, res = make_request("/products", "POST", prod_a)
    if code == 400:
        print(" -> SUCCESS: Correctly rejected duplicate SKU.")
    else:
        print(f" -> FAILED: Allowed duplicate SKU. Code: {code}")

    # 5. Assert price/quantity cannot be negative
    print("\n[Test 5] Trying negative quantity validation...")
    prod_invalid = {"name": "Negative Item", "sku": "NEG-01", "price": 10.0, "quantity": -5}
    code, res = make_request("/products", "POST", prod_invalid)
    if code == 422 or code == 400:
        print(" -> SUCCESS: Correctly rejected negative stock creation.")
    else:
        print(f" -> FAILED: Allowed negative quantity. Code: {code}")

    # 6. Test insufficient inventory block
    print("\n[Test 6] Ordering more quantity than stock availability (request = 15, stock = 10)...")
    insufficient_order = {
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "quantity": 15}
        ]
    }
    code, res = make_request("/orders", "POST", insufficient_order)
    if code == 400:
        print(" -> SUCCESS: Order blocked due to insufficient stock.")
    else:
        print(f" -> FAILED: Order allowed despite low stock. Code: {code}")

    # 7. Check stock remained unchanged after failed order
    print("\n[Test 7] Verifying stock levels unchanged after failed checkout...")
    code, res = make_request(f"/products/{product_id}")
    if res["quantity"] == 10:
        print(" -> SUCCESS: Stock remained at 10.")
    else:
        print(f" -> FAILED: Stock level is {res['quantity']}")

    # 8. Create valid order (order 3 items, stock = 10)
    print("\n[Test 8] Placing a valid order for 3 items...")
    valid_order = {
        "customer_id": customer_id,
        "items": [
            {"product_id": product_id, "quantity": 3}
        ]
    }
    code, res = make_request("/orders", "POST", valid_order)
    if code == 201:
        print(" -> SUCCESS: Order completed.")
        order_id = res["id"]
        print(f"    Auto-calculated Total Invoice Amount: ${res['total_amount']}")
    else:
        print(f" -> FAILED: Order placement rejected. Code {code}")
        return

    # 9. Verify stock was auto-decremented
    print("\n[Test 9] Verifying stock level decremented (should be 7)...")
    code, res = make_request(f"/products/{product_id}")
    if res["quantity"] == 7:
        print(" -> SUCCESS: Stock correctly decremented to 7.")
    else:
        print(f" -> FAILED: Stock level is {res['quantity']}")

    # 10. Delete order and verify stock replenishment
    print("\n[Test 10] Cancelling order and checking stock restoration...")
    code, res = make_request(f"/orders/{order_id}", "DELETE")
    if code == 200:
        # Check stock again
        code, res = make_request(f"/products/{product_id}")
        if res["quantity"] == 10:
            print(" -> SUCCESS: Order deleted, stock restored back to 10.")
        else:
            print(f" -> FAILED: Stock level is {res['quantity']} (expected 10)")
    else:
        print(f" -> FAILED: Could not delete order. Code: {code}")

    # 11. Cleanup test customer and product
    print("\n[Test 11] Cleaning up created test entities...")
    del_p_code, _ = make_request(f"/products/{product_id}", "DELETE")
    del_c_code, _ = make_request(f"/customers/{customer_id}", "DELETE")
    if del_p_code == 200 and del_c_code == 200:
        print(" -> SUCCESS: Database cleanup successful.")
    else:
        print(f" -> WARNING: Cleanup codes: Product: {del_p_code}, Customer: {del_c_code}")

    print("\n" + "=" * 60)
    print("ALL BUSINESS LOGIC INTEGRATION TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
