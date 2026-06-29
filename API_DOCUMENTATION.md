# Beer Depot Management System - API Documentation

## Overview

This API provides endpoints for managing a beer depot system including products, customers, sales, empty case transactions, and more. All endpoints use camelCase for request/response fields to match the frontend TypeScript types.

**Base URL:** `http://localhost:3000/api`

---

## Products

### GET /api/products
Get all products.

**Response:**
```json
[
  {
    "id": "p1",
    "name": "Primus",
    "brand": "Bralirwa",
    "category": "Lager",
    "fullCases": 100,
    "emptyCases": 40,
    "purchasePrice": 9000,
    "sellingPrice": 11000,
    "supplier": "Bralirwa Ltd",
    "batchNumber": "BR-001",
    "manufactureDate": "2026-01-01T00:00:00",
    "expiryDate": "2026-12-01T00:00:00",
    "lowStockThreshold": 10,
    "depositAmount": 3000,
    "createdAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/products
Create a new product.

**Request:**
```json
{
  "name": "Primus",
  "brand": "Bralirwa",
  "category": "Lager",
  "fullCases": 100,
  "emptyCases": 40,
  "purchasePrice": 9000,
  "sellingPrice": 11000,
  "supplier": "Bralirwa Ltd",
  "batchNumber": "BR-001",
  "manufactureDate": "2026-01-01T00:00:00",
  "expiryDate": "2026-12-01T00:00:00",
  "lowStockThreshold": 10,
  "depositAmount": 3000
}
```

**Response:** `201 Created` with the created product object.

### GET /api/products/{id}
Get a specific product by ID.

**Response:** Product object or `404 Not Found`.

### PATCH /api/products/{id}
Update a product.

**Request:**
```json
{
  "fullCases": 150,
  "sellingPrice": 12000
}
```

**Response:** Updated product object or `404 Not Found`.

### DELETE /api/products/{id}
Delete a product.

**Response:** Deleted product object or `404 Not Found`.

---

## Customers

### GET /api/customers
Get all customers.

**Response:**
```json
[
  {
    "id": "c1",
    "name": "Kigali Bar",
    "phone": "+250788000000",
    "email": "orders@kigali-bar.rw",
    "address": "Kigali",
    "type": "wholesale",
    "city": "Kigali",
    "notes": "",
    "totalSpent": 0,
    "totalTransactions": 0,
    "pendingEmpties": 0,
    "totalPurchases": 0,
    "refundableDeposits": 0,
    "unpaidBalance": 0,
    "createdAt": "2026-01-01T00:00:00",
    "updatedAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/customers
Create a new customer.

**Request:**
```json
{
  "name": "Kigali Bar",
  "phone": "+250788000000",
  "email": "orders@kigali-bar.rw",
  "address": "Kigali",
  "type": "wholesale",
  "city": "Kigali",
  "notes": ""
}
```

**Response:** `201 Created` with the created customer object.

### GET /api/customers/{id}
Get a specific customer by ID.

**Response:** Customer object or `404 Not Found`.

### PATCH /api/customers/{id}
Update a customer.

**Request:**
```json
{
  "phone": "+250788999999",
  "notes": "VIP customer"
}
```

**Response:** Updated customer object or `404 Not Found`.

### DELETE /api/customers/{id}
Delete a customer.

**Response:** Deleted customer object or `404 Not Found`.

---

## Sales

### GET /api/sales
Get all sales.

**Response:**
```json
[
  {
    "id": "sale1",
    "receiptNo": "RCP-1001",
    "customerId": "c1",
    "customerName": "Kigali Bar",
    "items": [
      {
        "productId": "p1",
        "name": "Primus",
        "quantity": 5,
        "unitPrice": 11000,
        "subtotal": 55000
      }
    ],
    "subtotal": 55000,
    "discount": 5000,
    "total": 50000,
    "payment": "mobile",
    "amountPaid": 60000,
    "change": 10000,
    "cashier": "Eric Mugisha",
    "paymentMethod": "mobile",
    "expectedEmpties": 5,
    "returnedEmpties": 0,
    "invoiceNumber": "INV-1234567890",
    "status": "completed",
    "createdAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/sales
Create a new sale.

**Frontend Behavior:**
- Reduces product `fullCases` and increases `emptyCases`
- Updates customer `pendingEmpties`, `totalPurchases`, `totalSpent`, `totalTransactions`, and `refundableDeposits`
- Automatically creates empty-case transactions

**Request:**
```json
{
  "customerId": 1,
  "customerName": "Kigali Bar",
  "items": [
    {
      "productId": 1,
      "quantity": 5
    }
  ],
  "discount": 5000,
  "payment": "mobile",
  "amountPaid": 60000,
  "cashier": "Eric Mugisha"
}
```

**Response:** `201 Created` with the created sale object.

### GET /api/sales/{id}
Get a specific sale by ID.

**Response:** Sale object or `404 Not Found`.

---

## Empty Case Transactions

### GET /api/empty-case-transactions
Get all empty case transactions.

**Response:**
```json
[
  {
    "id": "ect1",
    "productId": "p1",
    "customerId": "c1",
    "customerName": "Kigali Bar",
    "transactionType": "sale",
    "totalQuantity": 20,
    "returnedQuantity": 15,
    "pendingQuantity": 5,
    "depositAmount": 3000,
    "totalDepositValue": 60000,
    "refundedAmount": 45000,
    "productName": "Primus",
    "status": "partial",
    "notes": "Partial return received",
    "createdBy": "Eric Mugisha",
    "createdAt": "2026-01-01T00:00:00",
    "updatedAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/empty-case-transactions
Create a new empty case transaction.

**Request:**
```json
{
  "productId": "p1",
  "customerId": "c1",
  "customerName": "Kigali Bar",
  "transactionType": "sale",
  "totalQuantity": 20,
  "depositAmount": 3000,
  "createdBy": "Eric Mugisha"
}
```

**Response:** `201 Created` with the created transaction object.

### POST /api/empty-case-transactions/{id}/process-return
Process an empty case return.

**Frontend Behavior:**
- Updates the transaction status and quantities
- Updates customer deposits
- Updates activity feed
- Creates audit log entry

**Request:**
```json
{
  "returnQuantity": 3,
  "processedBy": "Claude Niyonzima"
}
```

**Response:** Updated transaction object or `404 Not Found` or `400 Bad Request` if return quantity exceeds pending quantity.

---

## Dashboard

### GET /api/reports/dashboard
Get dashboard data including summary metrics, charts, and tables.

**Response:**
```json
{
  "summary": {
    "totalRevenue": 550000,
    "totalExpenses": 120000,
    "netProfit": 430000,
    "profitMargin": 78.18,
    "totalSales": 50,
    "totalTransactions": 10,
    "avgOrderValue": 55000,
    "totalEmptyCases": 100,
    "returnedCases": 80,
    "pendingReturns": 20,
    "depositValue": 300000,
    "refundedValue": 240000,
    "totalProducts": 8,
    "lowStockCount": 2,
    "expiringCount": 1,
    "totalCustomers": 4,
    "activeCustomers": 3,
    "unreadNotifications": 3
  },
  "charts": {
    "salesTrend": [
      { "date": "01/01/2026", "amount": 50000, "count": 1 }
    ],
    "topProducts": [
      { "name": "Primus", "quantity": 30, "revenue": 330000 }
    ],
    "topCustomers": [
      { "name": "Kigali Bar", "spent": 200000, "transactions": 5 }
    ]
  },
  "tables": {
    "recentTransactions": [...],
    "pendingReturns": [...],
    "lowStockProducts": [...],
    "expiringProducts": [...]
  }
}
```

---

## Notifications

### GET /api/notifications
Get all notifications.

**Response:**
```json
[
  {
    "id": "n1",
    "level": "warning",
    "title": "Expiring soon",
    "message": "320 cases of Primus expire in 25 days",
    "createdAt": "2026-01-01T00:00:00",
    "read": false
  }
]
```

### POST /api/notifications/generate
Generate a new notification.

**Request:**
```json
{
  "level": "urgent",
  "title": "Low stock",
  "message": "Amstel is below the low-stock threshold"
}
```

**Response:** `201 Created` with the created notification object.

### POST /api/notifications/mark-read
Mark notifications as read.

**Request (mark specific):**
```json
{
  "notificationIds": ["n1", "n2"]
}
```

**Request (mark all):**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "updated": 5
}
```

---

## Suppliers

### GET /api/suppliers
Get all suppliers.

**Response:**
```json
[
  {
    "id": "s1",
    "name": "Bralirwa Ltd",
    "contact": "Patrick H.",
    "phone": "+250 788 111 222",
    "email": "sales@bralirwa.rw",
    "productsSupplied": 4,
    "createdAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/suppliers
Create a new supplier.

**Request:**
```json
{
  "name": "Bralirwa Ltd",
  "contact": "Patrick H.",
  "phone": "+250 788 111 222",
  "email": "sales@bralirwa.rw"
}
```

**Response:** `201 Created` with the created supplier object.

---

## Expenses

### GET /api/expenses
Get all expenses.

**Response:**
```json
[
  {
    "id": "e1",
    "title": "Delivery truck fuel",
    "category": "fuel",
    "amount": 85000,
    "date": "2026-01-01T00:00:00",
    "note": "Weekly refill",
    "recordedBy": "Aline Uwase",
    "invoiceNumber": "EXP-1234567890"
  }
]
```

### POST /api/expenses
Create a new expense.

**Request:**
```json
{
  "title": "Delivery truck fuel",
  "category": "fuel",
  "amount": 85000,
  "date": "2026-01-01T00:00:00",
  "note": "Weekly refill",
  "recordedBy": "Aline Uwase"
}
```

**Response:** `201 Created` with the created expense object.

---

## Users

### GET /api/users
Get all users.

**Response:**
```json
[
  {
    "id": "u1",
    "name": "Jean Bosco",
    "email": "owner@beerdepot.com",
    "role": "owner",
    "phone": "+250 788 100 100",
    "status": "active",
    "createdAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/users
Create a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "cashier",
  "phone": "+250 788 000 000"
}
```

**Response:** `201 Created` with the created user object.

---

## Activities

### GET /api/activities
Get all activities.

**Response:**
```json
[
  {
    "id": "a1",
    "type": "sale",
    "message": "Eric sold 20 cases of Primus to Kigali Bar & Lounge",
    "createdAt": "2026-01-01T00:00:00"
  }
]
```

### POST /api/activities
Create a new activity.

**Request:**
```json
{
  "type": "sale",
  "message": "Eric sold 20 cases of Primus to Kigali Bar & Lounge"
}
```

**Response:** `201 Created` with the created activity object.

---

## Supplier Returns

### GET /api/supplier-returns
Get all supplier returns.

**Response:**
```json
[
  {
    "id": "sr1",
    "supplierId": "s1",
    "supplierName": "Bralirwa Ltd",
    "productId": "p1",
    "productName": "Primus",
    "quantity": 50,
    "receiptNumber": "SUP-2024-001",
    "returnedDate": "2026-01-01T00:00:00",
    "receivedBy": "Claude Niyonzima",
    "notes": "Weekly return"
  }
]
```

### POST /api/supplier-returns
Create a new supplier return.

**Request:**
```json
{
  "supplierId": "s1",
  "supplierName": "Bralirwa Ltd",
  "productId": "p1",
  "productName": "Primus",
  "quantity": 50,
  "receivedBy": "Claude Niyonzima",
  "notes": "Weekly return"
}
```

**Response:** `201 Created` with the created supplier return object.

---

## Damaged Cases

### GET /api/damaged-cases
Get all damaged case reports.

**Response:**
```json
[
  {
    "id": "dc1",
    "productId": "p3",
    "productName": "Turbo King",
    "quantity": 5,
    "reason": "Broken during handling",
    "damageCost": 20000,
    "reportedDate": "2026-01-01T00:00:00",
    "reportedBy": "Claude Niyonzima",
    "notes": "Cases damaged during unloading"
  }
]
```

### POST /api/damaged-cases
Create a new damaged case report.

**Request:**
```json
{
  "productId": "p3",
  "productName": "Turbo King",
  "quantity": 5,
  "reason": "Broken during handling",
  "damageCost": 20000,
  "reportedBy": "Claude Niyonzima",
  "notes": "Cases damaged during unloading"
}
```

**Response:** `201 Created` with the created damaged case object.

---

## Transaction Audits

### GET /api/transaction-audits
Get all transaction audits.

**Response:**
```json
[
  {
    "id": "ta1",
    "transactionId": "ect1",
    "transactionType": "empty_case",
    "action": "created",
    "previousState": null,
    "newState": { "status": "pending" },
    "performedBy": "Eric Mugisha",
    "performedAt": "2026-01-01T00:00:00",
    "notes": "Initial transaction created"
  }
]
```

### POST /api/transaction-audits
Create a new transaction audit.

**Request:**
```json
{
  "transactionId": "ect1",
  "transactionType": "empty_case",
  "action": "updated",
  "previousState": { "status": "pending" },
  "newState": { "status": "partial" },
  "performedBy": "Eric Mugisha",
  "notes": "Partial return processed"
}
```

**Response:** `201 Created` with the created audit object.

---

## Notes

- All endpoints use in-memory storage for demonstration. In production, replace with a proper database.
- All date fields should be in ISO 8601 format (e.g., `2026-01-01T00:00:00`).
- The API accepts and returns camelCase fields to match the existing frontend TypeScript types.
- Error responses include appropriate HTTP status codes and error messages.
