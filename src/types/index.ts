export interface Address {
  _id: string;
  userId: string;
  firstName: string;
  lastName: string;
  mobileNumber: string;
  alternateMobileNumber: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  _id: string;
  id: string;
  title: string;
  description: string;
  discount: number;
  isUserOffer: boolean;
  triggerPrice: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  variant: string;
  title: string;
  price: number;
  quantity: number;
}

export interface UTMParams {
  _id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
}

export interface RazorpayOrder {
  _id: string;
  id: string;
  payments: any[];
  receipt: string;
  status: string;
}

export interface Order {
  _id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  orderStatus: 'CONFIRMED' | 'PENDING' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  deliveryStatus: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  time: string;
  items: OrderItem[];
  address: Omit<Address, '_id'> & { _id: string };
  cashOnDelivery: boolean;
  offers: Array<{
    _id: string;
    offerId: string;
    title: string;
    discount: number;
    type: string;
  }>;
  rewards: number;
  utmParams: UTMParams;
  razorpayOrder: RazorpayOrder;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSection {
  id: string;
  type: 'image' | 'text';
  order: number;
  desktopUrl?: string;
  mobileUrl?: string;
  alt?: string;
  caption?: string;
  heading?: string;
  body?: string;
  images?: any[];
  items?: any[];
}

export interface Product {
  _id: string;
  id: string;
  title: string;
  description: string;
  colorHex: string;
  bulletPoints: string[];
  mainVariant: string;
  sections: ProductSection[];
  badges: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id: string;
  id: string;
  title: string;
  unit: string;
  size: number;
  price: number;
  mrp: number;
  coverImage: string;
  cartImage: string;
  productId: string;
  otherImages: string[];
  variantOrder: number;
  label: string | null;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  author: string;
  userId: string;
  product: string;
  productId: string;
  rating: number;
  text: string;
  photos: string[];
  isApproved: boolean;
  replies: any[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Reward {
  _id: string;
  userId: string;
  rewardUnit: string;
  rewardValue: number;
  sourceType: string;
  sourceId: string;
  claimType: string | null;
  claimId: string | null;
  isClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  _id: string;
  expiresAt: string;
  token: string;
  ipAddress: string;
  userAgent: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  phoneNumber: string;
  phoneNumberVerified: boolean;
  email: string;
  name: string;
  avatar: string;
  offers: string[];
  noOfOrders: number;
  notes: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}