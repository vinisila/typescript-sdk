import { Konduto } from '../Konduto';
import { KondutoOrder } from '../models/KondutoOrder';
import { KondutoCustomer } from '../models/KondutoCustomer';
import { KondutoCreditCardPayment } from '../models/payments/KondutoCreditCardPayment';
import { KondutoOrderStatus } from '../models/enums/KondutoOrderStatus';
import { KondutoCreditCardPaymentStatus } from '../models/enums/KondutoCreditCardPaymentStatus';
import { KondutoRecommendation } from '../models/enums/KondutoRecommendation';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_API_KEY = 'T'.repeat(21); // 21-char sandbox key

function makeMockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function makeOrder(): KondutoOrder {
  const order = new KondutoOrder();
  order.id = 'ORD-TEST-001';
  order.total_amount = 199.9;
  order.installments = 1;

  const customer = new KondutoCustomer();
  customer.id = 'CUST-001';
  customer.name = 'Jane Doe';
  customer.email = 'jane@example.com';
  order.customer = customer;

  const payment = new KondutoCreditCardPayment();
  payment.bin = '490172';
  payment.last4 = '0012';
  payment.amount = 199.9;
  payment.status = KondutoCreditCardPaymentStatus.approved;
  order.payment = [payment];

  return order;
}

// ─── Constructor / API key validation ────────────────────────────────────────

describe('Konduto constructor', () => {
  it('accepts a 21-character API key', () => {
    expect(() => new Konduto(VALID_API_KEY)).not.toThrow();
  });

  it('throws RangeError for a key shorter than 21 chars', () => {
    expect(() => new Konduto('TOOSHORT')).toThrow(RangeError);
  });

  it('throws RangeError for a key longer than 21 chars', () => {
    expect(() => new Konduto('T'.repeat(22))).toThrow(RangeError);
  });

  it('throws RangeError for an empty key', () => {
    expect(() => new Konduto('')).toThrow(RangeError);
  });

  it('setApiKey() validates the key too', () => {
    const sdk = new Konduto(VALID_API_KEY);
    expect(() => sdk.setApiKey('bad')).toThrow(RangeError);
  });
});

// ─── base64 helpers ──────────────────────────────────────────────────────────

describe('Konduto.base64Encode / base64Decode', () => {
  it('encodes and decodes a string correctly', () => {
    const plain = 'T00000111112222233333';
    const encoded = Konduto.base64Encode(plain);
    expect(Konduto.base64Decode(encoded)).toBe(plain);
  });

  it('encodes the API key for Basic Auth correctly', () => {
    const key = 'T00000111112222233333';
    const encoded = Konduto.base64Encode(key);
    // Verify manually: Buffer.from('T00000111112222233333').toString('base64')
    expect(encoded).toBe(Buffer.from(key, 'utf-8').toString('base64'));
  });
});

// ─── URL builders ────────────────────────────────────────────────────────────

describe('Konduto URL builders', () => {
  const sdk = new Konduto(VALID_API_KEY);

  it('postOrderUrl() points to /orders', () => {
    expect(sdk.postOrderUrl()).toBe('https://api.konduto.com/v1/orders');
  });

  it('getOrderUrl() includes the order id', () => {
    expect(sdk.getOrderUrl('ORD-001')).toBe('https://api.konduto.com/v1/orders/ORD-001');
  });

  it('putOrderUrl() includes the order id', () => {
    expect(sdk.putOrderUrl('ORD-001')).toBe('https://api.konduto.com/v1/orders/ORD-001');
  });

  it('setEndpoint() overrides the base URL', () => {
    const sdk2 = new Konduto(VALID_API_KEY);
    sdk2.setEndpoint('https://sandbox.example.com/v1/');
    expect(sdk2.postOrderUrl()).toBe('https://sandbox.example.com/v1/orders');
  });
});

// ─── analyze() ───────────────────────────────────────────────────────────────

describe('Konduto.analyze()', () => {
  let sdk: Konduto;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    sdk = new Konduto(VALID_API_KEY);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('sends a POST request and merges the analysis response into the order', async () => {
    const apiResponse = {
      status: 'ok',
      order: {
        id: 'ORD-TEST-001',
        score: 0.07,
        recommendation: KondutoRecommendation.approve,
        status: 'APPROVED',
        geolocation: { city: 'São Paulo', state: 'SP', country: 'BR' },
      },
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const order = makeOrder();
    const result = await sdk.analyze(order);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.konduto.com/v1/orders');
    expect(init.method).toBe('POST');

    // Should have merged analysis results back
    expect(result.score).toBe(0.07);
    expect(result.recommendation).toBe(KondutoRecommendation.approve);
    expect(result.geolocation?.city).toBe('São Paulo');
  });

  it('throws for a 401 response', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(401, { message: 'Unauthorized' }));

    await expect(sdk.analyze(makeOrder())).rejects.toMatchObject({
      name: 'KondutoHTTPUnauthorizedException',
    });
  });

  it('throws for a 400 response', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(400, { message: 'Bad Request' }));

    await expect(sdk.analyze(makeOrder())).rejects.toMatchObject({
      name: 'KondutoHTTPBadRequestException',
    });
  });

  it('skips merging response when analyze=false', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, { status: 'ok' }));

    const order = makeOrder();
    order.analyze = false;
    const result = await sdk.analyze(order);

    // No score or recommendation merged
    expect(result.score).toBeUndefined();
    expect(result.recommendation).toBeUndefined();
  });

  it('includes Authorization header', async () => {
    const apiResponse = {
      status: 'ok',
      order: { id: 'ORD-TEST-001', score: 0.1, recommendation: 'APPROVE', status: 'APPROVED' },
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    await sdk.analyze(makeOrder());

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toMatch(/^Basic /);
  });
});

// ─── getOrder() ──────────────────────────────────────────────────────────────

describe('Konduto.getOrder()', () => {
  let sdk: Konduto;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    sdk = new Konduto(VALID_API_KEY);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('fetches an order by id and returns a KondutoOrder', async () => {
    const apiResponse = {
      order: {
        id: 'ORD-TEST-001',
        total_amount: 199.9,
        score: 0.05,
        recommendation: 'APPROVE',
        status: 'APPROVED',
        payment: [{ type: 'credit', bin: '490172', last4: '0012' }],
      },
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const order = await sdk.getOrder('ORD-TEST-001');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.konduto.com/v1/orders/ORD-TEST-001',
      expect.objectContaining({ method: 'GET' })
    );
    expect(order).toBeInstanceOf(KondutoOrder);
    expect(order.id).toBe('ORD-TEST-001');
    expect(order.score).toBe(0.05);
    // Polymorphic payment deserialization
    expect(order.payment).toHaveLength(1);
    expect(order.payment![0]).toBeInstanceOf(KondutoCreditCardPayment);
  });

  it('throws for a 404 response', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(404, { message: 'Not Found' }));

    await expect(sdk.getOrder('NONEXISTENT')).rejects.toMatchObject({
      name: 'KondutoHTTPNotFoundException',
    });
  });
});

// ─── updateOrderStatus() ─────────────────────────────────────────────────────

describe('Konduto.updateOrderStatus()', () => {
  let sdk: Konduto;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    sdk = new Konduto(VALID_API_KEY);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const allowedStatuses: KondutoOrderStatus[] = [
    KondutoOrderStatus.approved,
    KondutoOrderStatus.declined,
    KondutoOrderStatus.fraud,
    KondutoOrderStatus.canceled,
    KondutoOrderStatus.not_authorized,
  ];

  test.each(allowedStatuses)('accepts status=%s', async (status) => {
    fetchSpy.mockResolvedValueOnce(
      makeMockResponse(200, {
        order: { old_status: 'pending', new_status: status },
      })
    );

    await expect(
      sdk.updateOrderStatus('ORD-001', status, 'test comment')
    ).resolves.toBeUndefined();

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    const body = JSON.parse(init.body as string);
    expect(body.status).toBe(status);
    expect(body.comments).toBe('test comment');
  });

  it('throws RangeError for a disallowed status (pending)', async () => {
    await expect(
      sdk.updateOrderStatus('ORD-001', KondutoOrderStatus.pending, '')
    ).rejects.toThrow(RangeError);
  });

  it('throws RangeError for a disallowed status (not_analyzed)', async () => {
    await expect(
      sdk.updateOrderStatus('ORD-001', KondutoOrderStatus.not_analyzed, '')
    ).rejects.toThrow(RangeError);
  });

  it('throws when comments is null', async () => {
    await expect(
      sdk.updateOrderStatus('ORD-001', KondutoOrderStatus.approved, null as any)
    ).rejects.toThrow('Comments cannot be null.');
  });

  it('throws for a 500 response', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(500, { message: 'Internal Server Error' }));

    await expect(
      sdk.updateOrderStatus('ORD-001', KondutoOrderStatus.approved, '')
    ).rejects.toMatchObject({ name: 'KondutoHTTPInternalErrorException' });
  });
});

// ─── debug() ─────────────────────────────────────────────────────────────────

describe('Konduto.debug()', () => {
  it('returns a string containing the API key and endpoint', () => {
    const sdk = new Konduto(VALID_API_KEY);
    const info = sdk.debug();
    expect(info).toContain(VALID_API_KEY);
    expect(info).toContain('https://api.konduto.com/v1/');
  });
});
