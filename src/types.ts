export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number; // in USDT
  category: string;
  imageUrl: string;      // watermarked / blurred for non-buyers
  originalUrl: string;   // high-res for buyers
  videoUrl?: string;     // optional loop video
  mediaType: 'image' | 'video';
  sellerName: string;
  sellerAvatar: string;
  sellerUid: string;     // linked to user.uid
  likes: number;
  salesCount: number;
  views: number;
  stockCount?: number;   // stock limit, e.g., 5, 10 or undefined (unlimited)
  isSubscriberOnly?: boolean; // subscription locked
  createdAt: string;
}

export interface PriceDropNotification {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string;
  oldPrice: number;
  newPrice: number;
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'buyer' | 'seller';
  balance: number; // in USDT
  walletAddress?: string; // e.g. Sol / ETH address
  bio?: string;
  subscribedSellerUids?: string[]; // sellers this user is subscribed to
  subscriptionPrice?: number; // subscription cost per month in USDT (0 if disabled)
  wishlistIds?: string[]; // wishlisted listings
  priceAlertListingIds?: string[]; // listings user wants price drop notifications for
  notifications?: PriceDropNotification[]; // price drop alerts received
  cartIds?: string[]; // cart listings
  purchasedItemIds?: string[]; // wishlisted or purchased foot products
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CustomRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  footAngle: string;
  accessory: string;
  additionalInstructions: string;
  priceOffer: number;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

export interface Chat {
  id: string; // e.g. buyerUid_sellerUid
  buyerUid: string;
  buyerName: string;
  sellerUid: string;
  sellerName: string;
  lastMessage: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderUid: string;
  senderName: string;
  content: string;
  createdAt: string;
}
