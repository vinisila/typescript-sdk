# konduto-typescript-sdk

TypeScript SDK for the [Konduto Anti-Fraud API](https://docs.konduto.com).

## Installation

```bash
npm install konduto-typescript-sdk
```

## Requirements

- Node.js >= 18.0.0

## Quick Start

```typescript
import {
  Konduto,
  KondutoOrder,
  KondutoCustomer,
  KondutoCreditCardPayment,
} from 'konduto-typescript-sdk';
import { KondutoCreditCardPaymentStatus } from 'konduto-typescript-sdk';

const sdk = new Konduto(process.env.KONDUTO_API_KEY!);

// Build the order
const customer = new KondutoCustomer();
customer.id    = 'CUST-001';
customer.name  = 'Jane Doe';
customer.email = 'jane@example.com';

const payment = new KondutoCreditCardPayment();
payment.bin    = '490172';
payment.last4  = '0012';
payment.amount = 199.90;
payment.status = KondutoCreditCardPaymentStatus.approved;

const order = new KondutoOrder();
order.id           = 'ORD-001';
order.total_amount = 199.90;
order.installments = 1;
order.customer     = customer;
order.payment      = [payment];

// Analyze
const result = await sdk.analyze(order);
console.log('Score:', result.score);
console.log('Recommendation:', result.recommendation); // APPROVE | REVIEW | DECLINE

// Update status
import { KondutoOrderStatus } from 'konduto-typescript-sdk';
await sdk.updateOrderStatus('ORD-001', KondutoOrderStatus.approved, 'Confirmed by analyst');

// Get order
const fetched = await sdk.getOrder('ORD-001');
```

## API

### `new Konduto(apiKey: string)`

Creates a new SDK client. The API key must be exactly 21 characters.
Keys starting with `T` are **Sandbox** (test environment).

### `sdk.analyze(order: KondutoOrder): Promise<KondutoOrder>`

Sends an order for fraud analysis. Returns the order enriched with `score`,
`recommendation`, `geolocation`, `device`, and `navigation` fields.

### `sdk.getOrder(orderId: string): Promise<KondutoOrder>`

Fetches a previously submitted order by its ID.

### `sdk.updateOrderStatus(orderId, status, comments): Promise<void>`

Updates the lifecycle status of an order. Allowed statuses:
`approved` | `declined` | `fraud` | `canceled` | `not_authorized`

## License

MIT
