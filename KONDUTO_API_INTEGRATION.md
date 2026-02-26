# Konduto API — Integration Guide

> **Source:** [https://docs.konduto.com](https://docs.konduto.com)
> **Base URL (Production):** `https://api.konduto.com/v1`
> **Auth:** HTTP Basic Auth (private API key)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Authentication](#3-authentication)
4. [Environments (Sandbox vs Production)](#4-environments)
5. [Send Order (POST /orders)](#5-send-order)
   - [Root Object](#51-root-object)
   - [Customer](#52-customer)
   - [Payment](#53-payment)
   - [Billing & Shipping](#54-billing--shipping)
   - [Shopping Cart](#55-shopping-cart)
6. [API Response](#6-api-response)
   - [Analysis Response](#61-analysis-response)
   - [HTTP Codes](#62-http-codes)
7. [Update Order Status (PUT /orders/:id)](#7-update-order-status)
8. [Query Order (GET /orders/:id)](#8-query-order)
9. [Order Lifecycle & Status Transitions](#9-order-lifecycle--status-transitions)
10. [Blocklist / Allowlist / Reviewlist](#10-blocklist--allowlist--reviewlist)
11. [Webhooks (Notifications)](#11-webhooks-notifications)
12. [Decision Priority Rules](#12-decision-priority-rules)
13. [Full Integration Flow](#13-full-integration-flow)

---

## 1. Overview

Konduto is a real-time fraud analysis engine for online purchases. It uses **machine learning** to build exclusive models for each store, cross-referencing 2,000+ data points to return a risk recommendation.

Key concepts:

| Concept | Description |
|---|---|
| **Score** | Float between `0.0` (low risk) and `1.0` (high risk) |
| **Recommendation** | `APPROVE`, `REVIEW`, or `DECLINE` |
| **Status** | Current lifecycle state of the order |
| **Visitor** | Browser fingerprint captured by Konduto's JS snippet |

---

## 2. Architecture Diagram

```mermaid
graph TB
    subgraph "Your Application"
        FE[Frontend / Browser]
        BE[Backend / API]
    end

    subgraph "Konduto"
        JS[JS Snippet<br/>visitor fingerprint]
        API[Konduto REST API<br/>api.konduto.com/v1]
        ML[Machine Learning<br/>Engine]
        WH[Webhook<br/>Notifications]
    end

    FE -->|1. Load JS snippet| JS
    JS -->|2. Set visitor cookie| FE
    FE -->|3. Send visitor ID to backend| BE
    BE -->|4. POST /orders with visitor| API
    API -->|5. Real-time analysis| ML
    ML -->|6. Return score + recommendation| API
    API -->|7. JSON response| BE
    BE -->|8. Apply decision| FE
    WH -->|9. Status change notification| BE
```

---

## 3. Authentication

Konduto uses **HTTP Basic Auth**. Send your private API key as the username with an empty password, encoded in Base64.

```
Authorization: Basic BASE64(YOUR_PRIVATE_KEY:)
```

**Example:**

```
# Private key: T00000111112222233333
Authorization: Basic VDAwMDAwMTExMTEyMjIyMjMzMzMz
```

> Keys starting with `T` are **Sandbox** (test). Production keys start with a different letter.

**TypeScript example:**

```typescript
const apiKey = process.env.KONDUTO_API_KEY!;
const authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');

const response = await fetch('https://api.konduto.com/v1/orders', {
  method: 'POST',
  headers: {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(order),
});
```

---

## 4. Environments

| Environment | Key prefix | Purpose |
|---|---|---|
| **Sandbox** | `T` (test) | Integration testing, rule simulation, no real analysis |
| **Production** | Other | Real fraud analysis, charged per transaction |

> **Important:** Never use Sandbox responses to validate real buyers. It uses a simulator.

---

## 5. Send Order

**Endpoint:** `POST https://api.konduto.com/v1/orders`

### 5.1 Root Object

```json
{
  "id": "10000000001",
  "visitor": "da39a3ee5e6b4",
  "total_amount": 100.00,
  "shipping_amount": 20.00,
  "tax_amount": 3.45,
  "currency": "BRL",
  "installments": 2,
  "ip": "189.68.156.100",
  "purchased_at": "2018-12-25T12:00:25Z",
  "recurring": false,
  "risk_level": "low",
  "analyze": true,
  "sales_channel": "e-commerce",
  "customer": { },
  "payment": [ ],
  "billing": { },
  "shipping": { },
  "shopping_cart": [ ],
  "hotel": { },
  "travel": { },
  "seller": { },
  "events": [ ],
  "point_of_sale": { },
  "agent": { }
}
```

| Parameter | Required | Type | Description |
|---|---|---|---|
| `id` | **Yes** | String (max 100) | Unique order identifier |
| `visitor` | No | String (max 40) | Browser fingerprint from Konduto JS |
| `total_amount` | **Yes** | Number | Total order value |
| `shipping_amount` | No | Number | Shipping cost |
| `tax_amount` | No | Number | Tax value |
| `currency` | No | String (3) | ISO-4217 currency code (e.g. `BRL`, `USD`) |
| `installments` | **Yes** | Number (1–999) | Number of payment installments |
| `ip` | Recommended | String | IPv4 or IPv6 address of the customer |
| `purchased_at` | No | String (ISO 8601) | Order closing datetime |
| `recurring` | No | Boolean | Whether this is a recurring order |
| `risk_level` | Recommended | String | `low`, `medium`, or `high` |
| `analyze` | No | Boolean | If `false`, order is tracked but not analyzed (default: `true`) |
| `sales_channel` | **Yes** | String (max 100) | Sales channel identifier (e.g. `e-commerce`, `app`) |

### 5.2 Customer

```json
{
  "customer": {
    "id": "28372",
    "name": "Julia da Silva",
    "tax_id": "12345678909",
    "document_type": "cpf",
    "dob": "1970-12-25",
    "phone1": "11-1234-5678",
    "phone2": "21-2143-6578",
    "email": "jsilva@example.com",
    "created_at": "2010-12-25",
    "new": false,
    "vip": false,
    "type": "interno",
    "risk_level": "low",
    "risk_score": 0.5,
    "mother_name": "Maria da Silva"
  }
}
```

| Parameter | Required | Description |
|---|---|---|
| `id` | **Yes** | Unique customer identifier (consistent across orders) |
| `name` | **Yes** | Full name |
| `email` | **Yes** | Email address |
| `tax_id` | Recommended | CPF, CNPJ, or other tax document |
| `document_type` | Recommended | `CPF`, `CNPJ`, `RG`, `PASSPORT`, `OTHER`, `CPF_CNPJ` |
| `dob` | Recommended | Date of birth (YYYY-MM-DD) |
| `phone1` | Recommended | Primary phone |
| `phone2` | Recommended | Secondary phone |
| `created_at` | Recommended | Account creation date (YYYY-MM-DD) |
| `new` | Recommended | Boolean — is this a newly created account? |
| `vip` | Recommended | Boolean — is this a VIP / frequent buyer? |
| `risk_level` | Recommended | `low`, `medium`, or `high` |
| `risk_score` | Recommended | Float risk score from your own system |
| `mother_name` | Recommended | Mother's full name |

### 5.3 Payment

Supports multiple payment methods in the same order.

```json
{
  "payment": [
    {
      "type": "credit",
      "bin": "490172",
      "last4": "0012",
      "expiration_date": "072025",
      "status": "approved",
      "amount": 90.00,
      "holder": "Jane Doe",
      "cvv_result": "Y",
      "avs_result": "X",
      "tax_id": "11111111111"
    },
    {
      "type": "boleto",
      "amount": 10.00
    }
  ]
}
```

| Parameter | Required | Description |
|---|---|---|
| `type` | **Yes** | `credit`, `debit`, `boleto`, `transfer`, `voucher`, `balance`, `pix` |
| `status` | Yes (cards) | `approved`, `declined`, `pending` — only for `credit`/`debit` |
| `bin` | Recommended | First 6–10 digits of card number |
| `last4` | Recommended | Last 4 digits of card number |
| `amount` | Recommended | Payment amount |
| `expiration_date` | Recommended | Card expiry in `MMYYYY` format |
| `holder` | Optional | Cardholder name |
| `tax_id` | Recommended | Cardholder CPF |
| `cvv_result` | Recommended | CVV verification result code |
| `avs_result` | Recommended | Address Verification Service result code |
| `sha1` | Recommended | HMAC-SHA-256 integrity code |

### 5.4 Billing & Shipping

`billing` contains the cardholder address (invoice address).
`shipping` contains the delivery address.

```json
{
  "billing": {
    "name": "Julia da Silva",
    "address1": "Rua Dez de Abril, 23",
    "address2": "Apto. 45",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01001-001",
    "country": "BR"
  },
  "shipping": {
    "name": "Julia da Silva",
    "address1": "Rua Dez de Abril, 23",
    "address2": "Apto. 45",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01001-001",
    "country": "BR",
    "estimatedDate": "2024-12-25T12:00:25Z",
    "value": 8.41
  }
}
```

| Parameter | Required | Type | Description |
|---|---|---|---|
| `name` | Recommended | String (max 100) | Cardholder / recipient name |
| `address1` | Recommended | String (max 255) | Primary address |
| `address2` | Recommended | String (max 255) | Secondary address (apt, suite) |
| `city` | Recommended | String (max 100) | City |
| `state` | Recommended | String (max 100) | State/Province |
| `zip` | Recommended | String (max 100) | Postal code |
| `country` | Recommended | String (2) | ISO 3166-2 country code (e.g. `BR`) |
| `estimatedDate` | Optional | String (ISO 8601) | Estimated delivery datetime (`shipping` only) |
| `value` | Optional | Number | Shipping cost (`shipping` only) |

### 5.5 Shopping Cart

```json
{
  "shopping_cart": [
    {
      "sku": "9919023",
      "product_code": "123456789999",
      "category": 201,
      "name": "Green T-Shirt",
      "description": "Size M",
      "unit_cost": 29.99,
      "quantity": 1,
      "created_at": "2008-12-25",
      "deliveryType": "express delivery",
      "deliverySlaInMinutes": 50,
      "sellerId": "11"
    },
    {
      "sku": "0017273",
      "category": 202,
      "name": "Yellow Socks",
      "description": "Cotton Socks",
      "unit_cost": 7.50,
      "quantity": 2,
      "discount": 1.00
    }
  ]
}
```

| Parameter | Required | Description |
|---|---|---|
| `sku` | Recommended | Product SKU or inventory ID |
| `product_code` | Recommended | UPC, barcode, or secondary product ID |
| `category` | Recommended | Konduto category code (see [category list](https://docs.konduto.com/reference/categorias-de-produtos-e-codigos)) |
| `name` | Recommended | Product or service name |
| `description` | Recommended | Detailed description |
| `unit_cost` | Recommended | Cost per unit |
| `quantity` | Recommended | Number of units purchased |
| `discount` | Recommended | Discount amount for this item |
| `created_at` | Recommended | Product listing date (YYYY-MM-DD) |
| `deliveryType` | Optional | Delivery type description |
| `deliverySlaInMinutes` | Optional | Estimated delivery time in minutes |
| `sellerId` | Optional | Seller identifier (marketplace) |

---

## 6. API Response

### 6.1 Analysis Response

```json
{
  "status": "ok",
  "order": {
    "id": "ORD1837213",
    "visitor": "da39a3ee5e6b",
    "score": 0.07,
    "ip": "189.68.156.100",
    "recommendation": "APPROVE",
    "status": "APPROVED",
    "triggered_rules": [
      {
        "name": "Rule Name",
        "decision": "APPROVE",
        "priority": 1,
        "analysis_type": "Credit Card"
      }
    ],
    "triggered_decision_list": [
      {
        "trigger": "user@example.com",
        "type": "email",
        "decision": "APPROVE"
      }
    ],
    "geolocation": {
      "city": "São Paulo",
      "state": "SP",
      "country": "BR"
    },
    "navigation": {
      "session_time": 12,
      "referrer": "https://google.com",
      "time_site_1d": 25,
      "sessions_1d": 3
    },
    "device": {
      "fingerprint": "abc123",
      "platform": "desktop",
      "browser": "Chrome",
      "language": "pt-br"
    }
  }
}
```

| Field | Description |
|---|---|
| `score` | Float `0.0–1.0` (higher = more risk). Returns `-1` if `analyze=false` |
| `recommendation` | `APPROVE`, `REVIEW`, `DECLINE`, or `NONE` (if not analyzed) |
| `status` | `APPROVED`, `PENDING`, or `DECLINED` |
| `triggered_rules` | Rules that were fired for this order |
| `geolocation` | Detected customer location from IP |
| `navigation` | Behavioral data from JS snippet |
| `device` | Device/browser fingerprint data |

**Recommendation values:**

| Value | Meaning |
|---|---|
| `APPROVE` | Low fraud risk — safe to proceed |
| `REVIEW` | Uncertain — requires manual review |
| `DECLINE` | High fraud risk — reject order |
| `NONE` | Order was not analyzed (`analyze=false`) |

### 6.2 HTTP Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request — missing/invalid parameters |
| `401` | Unauthorized — invalid API key |
| `404` | Order not found |
| `409` | Conflict — order ID already exists |
| `429` | Too many requests — rate limit exceeded |
| `500` | Internal server error |

---

## 7. Update Order Status

**Endpoint:** `PUT https://api.konduto.com/v1/orders/{order_id}`

Use this to inform Konduto of the final decision (approve/decline) or chargebacks. **Every status update teaches the ML model.**

```json
{
  "status": "approve",
  "comments": "Documents confirmed by analyst"
}
```

| Status | Description |
|---|---|
| `APPROVED` | Order confirmed as legitimate |
| `DECLINED` | Order rejected due to fraud suspicion |
| `NOT_AUTHORIZED` | Payment declined by card issuer — use `analyze=false` on future sends |
| `CANCELED` | Order canceled for operational reasons |
| `FRAUD` | Confirmed fraud / chargeback received |

**TypeScript example:**

```typescript
async function updateOrderStatus(
  orderId: string,
  status: 'approve' | 'decline' | 'not_authorized' | 'canceled' | 'fraud',
  comments: string
) {
  const response = await fetch(
    `https://api.konduto.com/v1/orders/${orderId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, comments }),
    }
  );
  return response.json();
}
```

---

## 8. Query Order

**Endpoint:** `GET https://api.konduto.com/v1/orders/{order_id}`

Returns the full order object including score, recommendation, and all analysis data.

```typescript
async function getOrder(orderId: string) {
  const response = await fetch(
    `https://api.konduto.com/v1/orders/${orderId}`,
    {
      method: 'GET',
      headers: { 'Authorization': authHeader },
    }
  );
  return response.json();
}
```

---

## 9. Order Lifecycle & Status Transitions

```mermaid
stateDiagram-v2
    [*] --> PENDING: POST /orders\n(recommendation=REVIEW)

    [*] --> APPROVED: POST /orders\n(recommendation=APPROVE)

    [*] --> DECLINED: POST /orders\n(recommendation=DECLINE)

    PENDING --> APPROVED: PUT status=approve\n(analyst decision)
    PENDING --> DECLINED: PUT status=decline\n(analyst decision)
    PENDING --> NOT_AUTHORIZED: PUT status=not_authorized

    APPROVED --> FRAUD: PUT status=fraud\n(chargeback received)
    APPROVED --> CANCELED: PUT status=canceled

    DECLINED --> CANCELED: PUT status=canceled

    FRAUD --> [*]
    CANCELED --> [*]
    NOT_AUTHORIZED --> [*]
```

**Status meanings:**

| Status | Description |
|---|---|
| `PENDING` | Awaiting manual review (`REVIEW` recommendation) |
| `APPROVED` | Legitimate order — approved |
| `DECLINED` | Rejected — suspected fraud |
| `NOT_AUTHORIZED` | Payment rejected by card issuer |
| `CANCELED` | Canceled for operational reasons |
| `FRAUD` | Confirmed fraud — chargeback received |
| `NOT_ANALYZED` | Not analyzed (`analyze=false` or non-credit payment) |

---

## 10. Blocklist / Allowlist / Reviewlist

### Overview

```mermaid
graph LR
    Order[New Order] --> Check{Decision Lists}
    Check -->|Email in Blocklist| DECLINE[Auto DECLINE]
    Check -->|Email in Allowlist| APPROVE[Auto APPROVE]
    Check -->|Email in Reviewlist| REVIEW[Force REVIEW]
    Check -->|No match| ML[ML Analysis]
    ML --> Result[Score + Recommendation]
```

### Blocklist

Automatically **denies** any order containing blocked data.

| Entry type | POST URL |
|---|---|
| Email | `POST https://api.konduto.com/v1/blacklist/email` |
| Phone | `POST https://api.konduto.com/v1/blacklist/phone` |
| IP | `POST https://api.konduto.com/v1/blacklist/ip` |
| Name | `POST https://api.konduto.com/v1/blacklist/name` |
| BIN+Last4 | `POST https://api.konduto.com/v1/blacklist/bin_last4` |
| ZIP | `POST https://api.konduto.com/v1/blacklist/zip` |
| Tax ID | `POST https://api.konduto.com/v1/blacklist/tax_id` |

**Manage entries:**

```
POST   /v1/blacklist/email              — Add email
GET    /v1/blacklist/email/{email}      — Query email
PUT    /v1/blacklist/email/{email}      — Update expiry
DELETE /v1/blacklist/email/{email}      — Remove email
```

**Request body (add):**

```json
{
  "email": "bad.actor@example.com",
  "expiration": "2025-12-31"
}
```

### Allowlist

Automatically **approves** orders from trusted customers. Use with caution — short expiration recommended (1–2 days max).

```
POST   /v1/whitelist/email
GET    /v1/whitelist/email/{email}
PUT    /v1/whitelist/email/{email}
DELETE /v1/whitelist/email/{email}
```

### Reviewlist

Automatically sends matched orders to **manual review**.

```
POST   /v1/greylist/email
GET    /v1/greylist/email/{email}
PUT    /v1/greylist/email/{email}
DELETE /v1/greylist/email/{email}
```

---

## 11. Webhooks (Notifications)

Konduto sends webhook notifications when order statuses change. Configure your endpoint in the Konduto dashboard.

### Webhook Payload

```json
{
  "order_id": "ORD1837213",
  "timestamp": 1608898332000,
  "status": "APPROVED",
  "signature": "e1b27d01bc75780c791f057ce99615fcca07003cbc8029e1d8330bac7a273a57"
}
```

| Field | Description |
|---|---|
| `order_id` | Your order identifier |
| `timestamp` | Unix timestamp in milliseconds |
| `status` | New order status |
| `signature` | HMAC-SHA-256 for validation |

### Webhook Flow

```mermaid
sequenceDiagram
    participant K as Konduto
    participant App as Your Webhook Handler

    K->>App: POST /webhook
    Note over App: Receive JSON payload

    App->>App: Extract signature
    App->>App: Compute HMAC-SHA256
    Note over App: order_id#timestamp#status
    App->>App: Compare signatures

    alt Signatures match
        App->>App: Update order status in DB
        App-->>K: HTTP 200 OK
    else Signatures don't match
        App-->>K: HTTP 401 Unauthorized
        Note over App: Reject — possible spoofing
    end
```

### Validating Webhook Signature

The signature is computed as `HMAC-SHA-256(order_id + "#" + timestamp + "#" + status, private_key)`.

**TypeScript example:**

```typescript
import { createHmac } from 'crypto';

function validateWebhookSignature(
  payload: { order_id: string; timestamp: number; status: string; signature: string },
  privateKey: string
): boolean {
  const message = `${payload.order_id}#${payload.timestamp}#${payload.status}`;
  const expectedSignature = createHmac('sha256', privateKey)
    .update(message)
    .digest('hex');
  return expectedSignature === payload.signature;
}

// Express handler example
app.post('/webhook/konduto', (req, res) => {
  const isValid = validateWebhookSignature(req.body, process.env.KONDUTO_API_KEY!);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { order_id, status } = req.body;
  // Update your DB with new status
  await updateOrderStatus(order_id, status);

  res.status(200).json({ received: true });
});
```

---

## 12. Decision Priority Rules

When multiple rules apply to the same order, Konduto always chooses the **most cautious** action:

```mermaid
graph TB
    P1["1. Blocklist<br/>(always DECLINE)"]:::high
    P2["2. Rules → DECLINE"]:::high
    P3["3. Rules → REVIEW"]:::medium
    P4["4. Rules → APPROVE"]:::low
    P5["5. ML Algorithm Recommendation"]:::info

    P1 --> P2 --> P3 --> P4 --> P5

    classDef high fill:#ff4444,color:#fff
    classDef medium fill:#ffaa00,color:#000
    classDef low fill:#44bb44,color:#fff
    classDef info fill:#4488ff,color:#fff
```

> **Example:** If a rule approves orders under R$50 and the email is in the Blocklist → **order is DECLINED**.

---

## 13. Full Integration Flow

### E-commerce Checkout Integration

```mermaid
sequenceDiagram
    participant Browser as Customer Browser
    participant FE as Frontend
    participant BE as Your Backend
    participant PG as Payment Gateway
    participant K as Konduto API

    Browser->>FE: Starts browsing
    FE->>FE: Load Konduto JS snippet
    Note over FE: Collects visitor fingerprint

    Browser->>FE: Proceeds to checkout
    FE->>BE: POST /checkout (visitor ID from Konduto JS)
    BE->>PG: Process payment
    PG-->>BE: Payment result (approved/declined)

    BE->>K: POST /v1/orders (full order + visitor + payment status)
    K-->>BE: { score, recommendation, status }

    alt recommendation = APPROVE
        BE->>BE: Auto-approve order
        BE-->>FE: Order confirmed
    else recommendation = REVIEW
        BE->>BE: Hold order for manual review
        BE-->>FE: Order under review
        Note over BE: Analyst reviews manually
        BE->>K: PUT /v1/orders/:id (final decision)
    else recommendation = DECLINE
        BE->>BE: Cancel order
        BE-->>FE: Order declined
    end

    K-->>BE: Webhook: status change notification
    BE->>BE: Validate signature & update DB
```

### TypeScript Full Example

```typescript
interface KondutoOrder {
  id: string;
  visitor?: string;
  total_amount: number;
  shipping_amount?: number;
  tax_amount?: number;
  currency: string;
  installments: number;
  ip: string;
  analyze: boolean;
  sales_channel: string;
  customer: KondutoCustomer;
  payment: KondutoPayment[];
  billing?: KondutoAddress;
  shipping?: KondutoAddress;
  shopping_cart?: KondutoCartItem[];
}

class KondutoClient {
  private authHeader: string;
  private baseUrl = 'https://api.konduto.com/v1';

  constructor(apiKey: string) {
    this.authHeader = 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64');
  }

  async analyzeOrder(order: KondutoOrder) {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error(`Konduto error: ${res.status}`);
    return res.json();
  }

  async updateStatus(orderId: string, status: string, comments: string) {
    const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, comments }),
    });
    return res.json();
  }

  async getOrder(orderId: string) {
    const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      headers: { 'Authorization': this.authHeader },
    });
    return res.json();
  }
}

// Usage
const konduto = new KondutoClient(process.env.KONDUTO_API_KEY!);

const result = await konduto.analyzeOrder({
  id: 'ORDER-001',
  visitor: 'da39a3ee5e6b4',
  total_amount: 199.90,
  currency: 'BRL',
  installments: 3,
  ip: '189.68.156.100',
  analyze: true,
  sales_channel: 'e-commerce',
  customer: {
    id: 'CUST-001',
    name: 'Julia da Silva',
    email: 'julia@example.com',
    tax_id: '12345678909',
    phone1: '11-9999-8888',
    new: false,
    vip: false,
  },
  payment: [{
    type: 'credit',
    status: 'approved',
    bin: '490172',
    last4: '0012',
    expiration_date: '072027',
    amount: 199.90,
  }],
  billing: {
    name: 'Julia da Silva',
    address1: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip: '01001-001',
    country: 'BR',
  },
  shopping_cart: [{
    sku: 'PROD-001',
    name: 'Blue Sneaker',
    category: 901,
    unit_cost: 199.90,
    quantity: 1,
  }],
});

console.log('Score:', result.order.score);
console.log('Recommendation:', result.order.recommendation);

// Handle recommendation
switch (result.order.recommendation) {
  case 'APPROVE':
    await fulfillOrder(result.order.id);
    break;
  case 'REVIEW':
    await holdForManualReview(result.order.id);
    break;
  case 'DECLINE':
    await refundAndCancel(result.order.id);
    await konduto.updateStatus(result.order.id, 'declined', 'Auto-declined by ML');
    break;
}
```

---

## Additional Resources

- [Official Docs (Portuguese)](https://docs.konduto.com)
- [How the test environment works](https://ajuda.konduto.com/article/50-como-funciona-o-ambiente-de-testes)
- [Product categories & codes](https://docs.konduto.com/reference/categorias-de-produtos-e-codigos)
- [Common currencies (ISO-4217)](https://docs.konduto.com/reference/moedas-mais-comuns-1)
- Supported platforms: VTEX, Magento, PayZen, Vindi
