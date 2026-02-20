import { KondutoOrder } from './models/KondutoOrder';
import { KondutoOrderResponse } from './models/KondutoOrderResponse';
import { KondutoOrderStatus } from './models/enums/KondutoOrderStatus';
import { KondutoHTTPExceptionFactory } from './exceptions/KondutoHTTPExceptionFactory';
import { KondutoUnexpectedAPIResponseException } from './exceptions/KondutoUnexpectedAPIResponseException';
import { createPayment } from './utils/KondutoUtils';

const ALLOWED_UPDATE_STATUSES = new Set<KondutoOrderStatus>([
  KondutoOrderStatus.approved,
  KondutoOrderStatus.declined,
  KondutoOrderStatus.fraud,
  KondutoOrderStatus.canceled,
  KondutoOrderStatus.not_authorized,
]);

/**
 * Konduto is an HTTP client for connecting to Konduto's Anti-Fraud API.
 * @see http://docs.konduto.com
 */
export class Konduto {
  public static readonly VERSION = '1.0.0';

  private apiKey!: string;
  private endpoint!: string;
  private requestBody: string | null = null;
  private responseBody: string | null = null;

  /**
   * @param apiKey Merchant's secret API key (must be exactly 21 characters).
   */
  constructor(apiKey: string) {
    this.setApiKey(apiKey);
    this.endpoint = 'https://api.konduto.com/v1/';
  }

  /**
   * Sets the merchant secret API key.
   * @param apiKey Must be exactly 21 characters.
   */
  setApiKey(apiKey: string): void {
    if (!apiKey || apiKey.length !== 21) {
      throw new RangeError(`Illegal API Key: ${apiKey}`);
    }
    this.apiKey = apiKey;
  }

  /**
   * Sets a custom API endpoint (default: https://api.konduto.com/v1/).
   */
  setEndpoint(endpoint: string): void {
    this.endpoint = endpoint;
  }

  /**
   * Returns debug information about the last API request/response.
   */
  debug(): string {
    let info = `API Key: ${this.apiKey}\nEndpoint: ${this.endpoint}\n`;
    if (this.requestBody != null) {
      info += `Request body: ${this.requestBody}\n`;
    }
    if (this.responseBody != null) {
      info += `Response body: ${this.responseBody}\n`;
    }
    return info;
  }

  getOrderUrl(orderId: string): string {
    return `${this.endpoint}orders/${orderId}`;
  }

  postOrderUrl(): string {
    return `${this.endpoint}orders`;
  }

  putOrderUrl(orderId: string): string {
    return `${this.endpoint}orders/${orderId}`;
  }

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Basic ${Konduto.base64Encode(this.apiKey)}`,
      'X-Requested-With': `Konduto SDK TypeScript ${Konduto.VERSION}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  }

  /**
   * Queries an order from Konduto's API.
   * @param orderId The order identifier.
   * @returns The KondutoOrder populated with data from the API.
   */
  async getOrder(orderId: string): Promise<KondutoOrder> {
    this.requestBody = orderId;

    const response = await fetch(this.getOrderUrl(orderId), {
      method: 'GET',
      headers: this.buildHeaders(),
    });

    const responseText = await response.text();
    this.responseBody = responseText;

    if (!response.ok) {
      const ex = KondutoHTTPExceptionFactory.buildException(response.status, responseText);
      throw ex ?? new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const parsed = JSON.parse(responseText) as { order?: Record<string, unknown> };
    if (!parsed.order) {
      throw new KondutoUnexpectedAPIResponseException(responseText);
    }

    return Konduto.deserializeOrder(parsed.order);
  }

  /**
   * Sends an order to Konduto's API for fraud analysis.
   * @param order The order to analyze.
   * @returns The order populated with analysis results (score, recommendation, etc.).
   */
  async analyze(order: KondutoOrder): Promise<KondutoOrder> {
    const body = order.toJson();
    this.requestBody = body;

    const response = await fetch(this.postOrderUrl(), {
      method: 'POST',
      headers: this.buildHeaders(),
      body,
    });

    const responseText = await response.text();
    this.responseBody = responseText;

    if (!response.ok) {
      const ex = KondutoHTTPExceptionFactory.buildException(response.status, responseText);
      throw ex ?? new Error(`HTTP ${response.status}: ${responseText}`);
    }

    if (order.analyze) {
      const parsed = JSON.parse(responseText) as {
        status?: string;
        order?: Record<string, unknown>;
      };
      if (!parsed.order) {
        throw new KondutoUnexpectedAPIResponseException(responseText);
      }
      const orderResponse = Konduto.deserializeOrderResponse(parsed.order);
      order.mergeKondutoOrderResponse(orderResponse);
    }

    return order;
  }

  /**
   * Updates the status of an existing order.
   * @param orderId The order identifier.
   * @param newStatus The new status (approved, declined, fraud, canceled, or not_authorized).
   * @param comments A comment for the status change (required, can be empty string).
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: KondutoOrderStatus,
    comments: string
  ): Promise<void> {
    if (!ALLOWED_UPDATE_STATUSES.has(newStatus)) {
      throw new RangeError(`Illegal status: ${newStatus}`);
    }
    if (comments == null) {
      throw new Error('Comments cannot be null.');
    }

    const body = JSON.stringify({ status: newStatus, comments });

    const response = await fetch(this.putOrderUrl(orderId), {
      method: 'PUT',
      headers: this.buildHeaders(),
      body,
    });

    const responseText = await response.text();
    this.responseBody = responseText;

    if (!response.ok) {
      const ex = KondutoHTTPExceptionFactory.buildException(response.status, responseText);
      throw ex ?? new Error(`HTTP ${response.status}: ${responseText}`);
    }

    const parsed = JSON.parse(responseText) as { order?: Record<string, unknown> };
    if (parsed.order) {
      const updatedOrder = parsed.order;
      if (!('old_status' in updatedOrder) || !('new_status' in updatedOrder)) {
        throw new KondutoUnexpectedAPIResponseException(responseText);
      }
    }
  }

  /**
   * Encodes a plain text string to Base64.
   */
  static base64Encode(plainText: string): string {
    return Buffer.from(plainText, 'utf-8').toString('base64');
  }

  /**
   * Decodes a Base64 encoded string.
   */
  static base64Decode(base64EncodedData: string): string {
    return Buffer.from(base64EncodedData, 'base64').toString('utf-8');
  }

  /**
   * Deserializes a plain object from the API into a KondutoOrder instance,
   * including polymorphic payment type handling.
   */
  private static deserializeOrder(data: Record<string, unknown>): KondutoOrder {
    const order = new KondutoOrder();
    Object.assign(order, data);

    // Deserialize polymorphic payment types
    if (Array.isArray(data['payment'])) {
      order.payment = (data['payment'] as Record<string, unknown>[]).map(createPayment);
    }

    return order;
  }

  /**
   * Deserializes a plain object from the API into a KondutoOrderResponse instance.
   */
  private static deserializeOrderResponse(data: Record<string, unknown>): KondutoOrderResponse {
    const response = new KondutoOrderResponse();
    Object.assign(response, data);
    return response;
  }
}
