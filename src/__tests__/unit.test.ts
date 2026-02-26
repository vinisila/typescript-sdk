import { KondutoModel } from '../models/KondutoModel';
import { KondutoOrder } from '../models/KondutoOrder';
import { KondutoCustomer } from '../models/KondutoCustomer';
import { KondutoItem } from '../models/KondutoItem';
import { KondutoAddress } from '../models/KondutoAddress';
import { KondutoTravel } from '../models/KondutoTravel';
import { KondutoTravelType } from '../models/enums/KondutoTravelType';
import { KondutoTravelInformation } from '../models/KondutoTravelInformation';
import { KondutoPassenger } from '../models/KondutoPassenger';
import { KondutoCreditCardPayment } from '../models/payments/KondutoCreditCardPayment';
import { KondutoBoletoPayment } from '../models/payments/KondutoBoletoPayment';
import { KondutoDebitPayment } from '../models/payments/KondutoDebitPayment';
import { KondutoVoucherPayment } from '../models/payments/KondutoVoucherPayment';
import { KondutoTransferPayment } from '../models/payments/KondutoTransferPayment';
import { KondutoPaymentType } from '../models/enums/KondutoPaymentType';
import { KondutoCreditCardPaymentStatus } from '../models/enums/KondutoCreditCardPaymentStatus';
import { createPayment, loadJson, getFirstJArrayElement } from '../utils/KondutoUtils';
import { KondutoHTTPExceptionFactory } from '../exceptions/KondutoHTTPExceptionFactory';

// ─── KondutoModel ────────────────────────────────────────────────────────────

describe('KondutoModel', () => {
  it('toJSON() omits null and undefined values', () => {
    const m = new KondutoModel();
    (m as any).foo = 'bar';
    (m as any).baz = null;
    (m as any).qux = undefined;
    const json = m.toJSON();
    expect(json['foo']).toBe('bar');
    expect('baz' in json).toBe(false);
    expect('qux' in json).toBe(false);
  });

  it('toJSON() omits private (_) prefixed fields', () => {
    const m = new KondutoModel();
    const json = m.toJSON();
    expect(Object.keys(json).some(k => k.startsWith('_'))).toBe(false);
  });

  it('toJson() returns a JSON string', () => {
    const m = new KondutoModel();
    (m as any).hello = 'world';
    const str = m.toJson();
    expect(typeof str).toBe('string');
    expect(JSON.parse(str)).toMatchObject({ hello: 'world' });
  });

  it('isValid() returns true for a valid model', () => {
    const m = new KondutoModel();
    expect(m.isValid()).toBe(true);
    expect(m.getError()).toBeNull();
  });

  it('fromJson() deserializes a plain object', () => {
    const data = { id: 'x', total_amount: 50 };
    const result = KondutoModel.fromJson<{ id: string; total_amount: number }>(
      JSON.stringify(data)
    );
    expect(result.id).toBe('x');
    expect(result.total_amount).toBe(50);
  });
});

// ─── KondutoOrder ────────────────────────────────────────────────────────────

describe('KondutoOrder', () => {
  function makeMinimalOrder(): KondutoOrder {
    const order = new KondutoOrder();
    order.id = 'ORD-001';
    order.total_amount = 100;
    order.installments = 1;

    const customer = new KondutoCustomer();
    customer.id = 'CUST-001';
    customer.name = 'Jane Doe';
    customer.email = 'jane@example.com';
    order.customer = customer;

    return order;
  }

  it('serializes a minimal order to JSON without null fields', () => {
    const order = makeMinimalOrder();
    const parsed = JSON.parse(order.toJson());
    expect(parsed.id).toBe('ORD-001');
    expect(parsed.total_amount).toBe(100);
    expect(parsed.customer.name).toBe('Jane Doe');
    // analyze defaults to true
    expect(parsed.analyze).toBe(true);
    // undefined fields should not appear
    expect('score' in parsed).toBe(false);
    expect('recommendation' in parsed).toBe(false);
  });

  it('toJSON() throws when shopping_cart and travel both set', () => {
    const order = makeMinimalOrder();

    const item = new KondutoItem();
    item.name = 'Widget';
    order.shopping_cart = [item];

    const travelInfo = new KondutoTravelInformation();
    const passenger = new KondutoPassenger();
    const travel = new KondutoTravel();
    travel.type = KondutoTravelType.flight;
    travel.departure = travelInfo;
    travel.passengers = [passenger];
    order.travel = travel;

    expect(() => order.toJSON()).toThrow(
      'Shopping cart and travel object cannot exist in the same order.'
    );
  });

  it('toJSON() includes shopping_cart items', () => {
    const order = makeMinimalOrder();
    const item = new KondutoItem();
    item.name = 'Widget';
    item.unit_cost = 50;
    item.quantity = 2;
    order.shopping_cart = [item];

    const parsed = JSON.parse(order.toJson());
    expect(parsed.shopping_cart).toHaveLength(1);
    expect(parsed.shopping_cart[0].name).toBe('Widget');
  });

  it('toJSON() includes billing and shipping addresses', () => {
    const order = makeMinimalOrder();
    const addr = new KondutoAddress();
    addr.name = 'Jane Doe';
    addr.city = 'São Paulo';
    addr.country = 'BR';
    order.billing = addr;
    order.shipping = addr;

    const parsed = JSON.parse(order.toJson());
    expect(parsed.billing.city).toBe('São Paulo');
    expect(parsed.shipping.country).toBe('BR');
  });

  it('toJSON() includes payment array', () => {
    const order = makeMinimalOrder();
    const payment = new KondutoCreditCardPayment();
    payment.bin = '490172';
    payment.last4 = '0012';
    payment.amount = 100;
    payment.status = KondutoCreditCardPaymentStatus.approved;
    order.payment = [payment];

    const parsed = JSON.parse(order.toJson());
    expect(parsed.payment).toHaveLength(1);
    expect(parsed.payment[0].type).toBe('credit');
    expect(parsed.payment[0].bin).toBe('490172');
  });
});

// ─── KondutoTravel ───────────────────────────────────────────────────────────

describe('KondutoTravel', () => {
  it('toJSON() renames return_travel to return', () => {
    const travel = new KondutoTravel();
    travel.type = KondutoTravelType.flight;
    const dep = new KondutoTravelInformation();
    travel.departure = dep;
    travel.passengers = [];

    const ret = new KondutoTravelInformation();
    travel.return_travel = ret;

    const json = travel.toJSON();
    expect('return' in json).toBe(true);
    expect('return_travel' in json).toBe(false);
  });

  it('toJSON() omits return when return_travel is absent', () => {
    const travel = new KondutoTravel();
    travel.type = KondutoTravelType.flight;
    travel.departure = new KondutoTravelInformation();
    travel.passengers = [];

    const json = travel.toJSON();
    expect('return' in json).toBe(false);
    expect('return_travel' in json).toBe(false);
  });
});

// ─── Payment models ──────────────────────────────────────────────────────────

describe('Payment models', () => {
  it('KondutoCreditCardPayment has type=credit', () => {
    const p = new KondutoCreditCardPayment();
    expect(p.type).toBe(KondutoPaymentType.credit);
  });

  it('KondutoBoletoPayment has type=boleto', () => {
    const p = new KondutoBoletoPayment();
    expect(p.type).toBe(KondutoPaymentType.boleto);
  });

  it('KondutoDebitPayment has type=debit', () => {
    const p = new KondutoDebitPayment();
    expect(p.type).toBe(KondutoPaymentType.debit);
  });

  it('KondutoVoucherPayment has type=voucher', () => {
    const p = new KondutoVoucherPayment();
    expect(p.type).toBe(KondutoPaymentType.voucher);
  });

  it('KondutoTransferPayment has type=transfer', () => {
    const p = new KondutoTransferPayment();
    expect(p.type).toBe(KondutoPaymentType.transfer);
  });
});

// ─── createPayment ───────────────────────────────────────────────────────────

describe('createPayment', () => {
  it('creates KondutoCreditCardPayment for type=credit', () => {
    const p = createPayment({ type: 'credit', bin: '490172', last4: '0012' });
    expect(p).toBeInstanceOf(KondutoCreditCardPayment);
    expect((p as KondutoCreditCardPayment).bin).toBe('490172');
  });

  it('creates KondutoBoletoPayment for type=boleto', () => {
    const p = createPayment({ type: 'boleto', amount: 10 });
    expect(p).toBeInstanceOf(KondutoBoletoPayment);
    expect(p.amount).toBe(10);
  });

  it('creates KondutoDebitPayment for type=debit', () => {
    const p = createPayment({ type: 'debit' });
    expect(p).toBeInstanceOf(KondutoDebitPayment);
  });

  it('creates KondutoTransferPayment for type=transfer', () => {
    const p = createPayment({ type: 'transfer' });
    expect(p).toBeInstanceOf(KondutoTransferPayment);
  });

  it('creates KondutoVoucherPayment for type=voucher', () => {
    const p = createPayment({ type: 'voucher', amount: 5 });
    expect(p).toBeInstanceOf(KondutoVoucherPayment);
  });

  it('falls back to KondutoCreditCardPayment for unknown type', () => {
    const p = createPayment({ type: 'unknown_type' });
    expect(p).toBeInstanceOf(KondutoCreditCardPayment);
  });
});

// ─── loadJson / getFirstJArrayElement ────────────────────────────────────────

describe('KondutoUtils', () => {
  it('loadJson() parses a JSON string into a KondutoModel subtype', () => {
    const result = loadJson<KondutoOrder>('{"id":"abc","total_amount":10}');
    expect(result.id).toBe('abc');
    expect(result.total_amount).toBe(10);
  });

  it('getFirstJArrayElement() returns JSON of the first array element', () => {
    const json = '[{"a":1},{"b":2}]';
    const first = getFirstJArrayElement(json);
    expect(JSON.parse(first)).toEqual({ a: 1 });
  });
});

// ─── KondutoHTTPExceptionFactory ─────────────────────────────────────────────

describe('KondutoHTTPExceptionFactory', () => {
  const cases: [number, string][] = [
    [400, 'KondutoHTTPBadRequestException'],
    [401, 'KondutoHTTPUnauthorizedException'],
    [403, 'KondutoHTTPForbiddenException'],
    [404, 'KondutoHTTPNotFoundException'],
    [405, 'KondutoHTTPMethodNotAllowedException'],
    [422, 'KondutoHTTPUnprocessableEntityException'],
    [429, 'KondutoHTTPTooManyRequestsException'],
    [500, 'KondutoHTTPInternalErrorException'],
  ];

  test.each(cases)('status %i → %s', (status, name) => {
    const ex = KondutoHTTPExceptionFactory.buildException(status, 'body');
    expect(ex).not.toBeNull();
    expect(ex!.name).toBe(name);
  });

  it('returns null for unmapped status codes', () => {
    expect(KondutoHTTPExceptionFactory.buildException(418, 'body')).toBeNull();
    expect(KondutoHTTPExceptionFactory.buildException(503, 'body')).toBeNull();
  });
});
