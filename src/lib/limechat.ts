import { getLimeChatAccessToken, getLimeChatAccountId } from './env'

interface LimeChatEventData {
  order_id: string;
  total_amount: number;
  currency?: string;
  waybill?: string;
  product_name?: string;
  product_image_url?: string;
  customer_name?: string;
  [key: string]: any;
}

class LimeChatService {
  private readonly LIMECHAT_API_ENDPOINT = 'https://flow-builder.limechat.ai/api/v1/cvf-events';
  private readonly LIMECHAT_ACCESS_TOKEN: string;
  private readonly LIMECHAT_ACCOUNT_ID: string;

  constructor() {
    this.LIMECHAT_ACCESS_TOKEN = getLimeChatAccessToken();
    this.LIMECHAT_ACCOUNT_ID = getLimeChatAccountId();
  }

  private async sendEvent(eventName: string, data: LimeChatEventData, phone: string, distinct_id: string) {
    const maskedPhone = phone.replace(/\d(?=\d{4})/g, '*');
    console.info(`Sending LimeChat event: ${eventName} for phone: ${maskedPhone} with distinct_id: ${distinct_id}`);

    // Skip if no phone/distinct_id is provided
    if (!distinct_id || !phone) {
      console.warn(`LimeChat event requires distinct_id and phone. Skipping event: ${eventName}`);
      return;
    }

    // Use phone number (without +) as distinct_id since LimeChat uses distinct_id as phone
    const phoneAsDistinctId = phone.startsWith('+') ? phone.substring(1) : phone;

    // Flatten data object as recommended by LimeChat docs
    const flattenedData: Record<string, any> = {};
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Basic flattening for one level - adjust if deeper nesting exists
        Object.entries(value).forEach(([subKey, subValue]) => {
          flattenedData[`${key}_${subKey}`] = subValue;
        });
      } else if (Array.isArray(value)) {
        // Handle arrays - e.g., stringify or send specific items
        // Example: Sending product IDs as a comma-separated string
        if (key === 'products' && value.every(item => typeof item === 'object' && item !== null && 'product_id' in item)) {
          flattenedData[`${key}_ids`] = value.map(item => (item as any).product_id).join(',');
        } else {
          flattenedData[key] = JSON.stringify(value);
        }
      } else {
        flattenedData[key] = value;
      }
    });

    const body = {
      distinct_id: phoneAsDistinctId, // Use phone without + as distinct_id
      phone: phone, // Keep original phone with country code prefix
      event: eventName,
      data: flattenedData,
    };

    try {
      const response = await fetch(this.LIMECHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-limechat-uat': this.LIMECHAT_ACCESS_TOKEN,
          'x-fb-account-id': this.LIMECHAT_ACCOUNT_ID,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LimeChat API error for event ${eventName}: Status ${response.status} - ${response.statusText} - ${errorText}`);
      } else {
        console.info(`LimeChat event sent successfully: ${eventName}`);
      }
    } catch (error) {
      console.error(`Failed to send LimeChat event ${eventName}: ${error}`);
    }
  }

  sendShippingEvent = (
    eventName: string,
    orderId: string,
    totalAmount: number,
    productName: string = '',
    productImageUrl: string = '',
    waybill: string = '',
    phone: string = '',
    distinct_id: string = '',
    customer_name: string = '',
  ) => {
    const eventData = {
      order_id: orderId,
      total_amount: totalAmount,
      currency: 'INR',
      waybill: waybill,
      product_name: productName,
      product_image_url: productImageUrl,
      customer_name: customer_name,
    };
    this.sendEvent(eventName, eventData, phone, distinct_id);
  };
}

export const limechatService = new LimeChatService();