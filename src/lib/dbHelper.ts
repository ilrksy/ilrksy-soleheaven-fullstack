import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  increment,
  getDoc,
  deleteDoc,
  orderBy
} from "firebase/firestore";
import { db } from "./firebase";
import { Listing, Review, CustomRequest, UserProfile, Chat, Message } from "../types";
import { INITIAL_LISTINGS, INITIAL_REVIEWS } from "../data/initialData";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Hardened error handler following Firebase skill specifications
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to check if database is empty and seed it
export async function checkAndSeedDatabase() {
  const path = "listings";
  try {
    const listingsCol = collection(db, "listings");
    const snapshot = await getDocs(listingsCol);
    if (snapshot.empty) {
      console.log("Firestore listings empty, seeding with initial data...");
      for (const listing of INITIAL_LISTINGS) {
        await setDoc(doc(db, "listings", listing.id), listing);
      }
      
      for (const review of INITIAL_REVIEWS) {
        await setDoc(doc(db, "reviews", review.id), review);
      }
      console.log("Seeding completed successfully.");
    }
  } catch (error) {
    console.warn("Could not seed Firestore, using local fallback mode:", error);
  }
}

// Get all listings
export async function getListings(): Promise<Listing[]> {
  const path = "listings";
  try {
    const listingsCol = collection(db, "listings");
    const snapshot = await getDocs(listingsCol);
    if (snapshot.empty) {
      await checkAndSeedDatabase();
      const freshSnapshot = await getDocs(listingsCol);
      if (!freshSnapshot.empty) {
        return freshSnapshot.docs.map(doc => doc.data() as Listing);
      }
      return INITIAL_LISTINGS;
    }
    return snapshot.docs.map(doc => doc.data() as Listing);
  } catch (error) {
    console.warn("Error getting listings, falling back to local:", error);
    const stored = localStorage.getItem("solehaven_listings");
    if (stored) return JSON.parse(stored);
    localStorage.setItem("solehaven_listings", JSON.stringify(INITIAL_LISTINGS));
    return INITIAL_LISTINGS;
  }
}

// Add a listing
export async function addNewListing(listing: Listing): Promise<Listing> {
  const path = `listings/${listing.id}`;
  try {
    await setDoc(doc(db, "listings", listing.id), listing);
    return listing;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return listing;
  }
}

// Get reviews for a listing
export async function getReviews(listingId: string): Promise<Review[]> {
  try {
    const q = query(collection(db, "reviews"), where("listingId", "==", listingId));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => doc.data() as Review);
    if (reviews.length === 0) {
      return INITIAL_REVIEWS.filter(r => r.listingId === listingId);
    }
    return reviews;
  } catch (error) {
    console.warn("Error getting reviews, using local fallback:", error);
    const stored = localStorage.getItem("solehaven_reviews");
    const allReviews: Review[] = stored ? JSON.parse(stored) : INITIAL_REVIEWS;
    return allReviews.filter(r => r.listingId === listingId);
  }
}

// Add review
export async function addReview(reviewData: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const newReview: Review = {
    ...reviewData,
    id: `rev_${Date.now()}`,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "reviews", newReview.id), newReview);
  } catch (error) {
    console.warn("Error saving review, saving locally:", error);
    const stored = localStorage.getItem("solehaven_reviews");
    const allReviews: Review[] = stored ? JSON.parse(stored) : INITIAL_REVIEWS;
    allReviews.push(newReview);
    localStorage.setItem("solehaven_reviews", JSON.stringify(allReviews));
  }
  return newReview;
}

// Get user profile or create default
export async function getUserProfile(uid: string, email: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Ensure arrays exist
      return {
        ...data,
        subscribedSellerUids: data.subscribedSellerUids || [],
        wishlistIds: data.wishlistIds || [],
        cartIds: data.cartIds || [],
      } as UserProfile;
    } else {
      const defaultProfile: UserProfile = {
        uid,
        email,
        displayName: email.split("@")[0],
        role: "buyer",
        balance: 200.00, // $200 USDT default pre-funded balance for demo convenience!
        subscribedSellerUids: [],
        wishlistIds: [],
        cartIds: [],
        subscriptionPrice: 10.00, // default sub price if they toggle seller mode
        bio: "Pencinta seni digital Web3 Melayu.",
        walletAddress: "0x71C...3a59",
        createdAt: new Date().toISOString()
      };
      await setDoc(userDocRef, defaultProfile);
      return defaultProfile;
    }
  } catch (error) {
    console.warn("Error getting user profile, using local fallback:", error);
    const key = `solehaven_user_${uid}`;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    
    const defaultProfile: UserProfile = {
      uid,
      email,
      displayName: email.split("@")[0],
      role: "buyer",
      balance: 200.00,
      subscribedSellerUids: [],
      wishlistIds: [],
      cartIds: [],
      subscriptionPrice: 10.00,
      bio: "Pencinta seni digital Web3 Melayu.",
      walletAddress: "0x71C...3a59",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(defaultProfile));
    return defaultProfile;
  }
}

// Create new user profile explicitly during sign up
export async function createNewUserAccount(uid: string, email: string, displayName: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  const newProfile: UserProfile = {
    uid,
    email,
    displayName,
    role: "buyer",
    balance: 200.00, // Preloaded with 200.00 USDT
    subscribedSellerUids: [],
    wishlistIds: [],
    cartIds: [],
    subscriptionPrice: 10.00,
    bio: "Pencinta seni digital Web3 Melayu.",
    walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "users", uid), newProfile);
    return newProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return newProfile;
  }
}

// Delete account in Firestore
export async function deleteUserAccount(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Update user profile balance
export async function updateUserBalance(uid: string, newBalance: number): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, { balance: newBalance });
  } catch (error) {
    console.warn("Error updating balance, using local fallback:", error);
    const key = `solehaven_user_${uid}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const profile = JSON.parse(stored) as UserProfile;
      profile.balance = newBalance;
      localStorage.setItem(key, JSON.stringify(profile));
    }
  }
}

// Update entire seller details
export async function updateSellerProfile(
  uid: string, 
  displayName: string, 
  bio: string, 
  walletAddress: string, 
  subscriptionPrice: number,
  role: 'buyer' | 'seller'
): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    await updateDoc(userDocRef, {
      displayName,
      bio,
      walletAddress,
      subscriptionPrice,
      role
    });
    const snapshot = await getDoc(userDocRef);
    return snapshot.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    // Local fallback
    const key = `solehaven_user_${uid}`;
    const stored = localStorage.getItem(key);
    if (!stored) throw new Error("No local user profile");
    const profile = JSON.parse(stored) as UserProfile;
    profile.displayName = displayName;
    profile.bio = bio;
    profile.walletAddress = walletAddress;
    profile.subscriptionPrice = subscriptionPrice;
    profile.role = role;
    localStorage.setItem(key, JSON.stringify(profile));
    return profile;
  }
}

// Subscribe to a seller
export async function subscribeToSeller(uid: string, sellerUid: string, price: number): Promise<UserProfile> {
  const buyerPath = `users/${uid}`;
  const sellerPath = `users/${sellerUid}`;
  try {
    // 1. Update buyer subscription list and decrement balance
    const buyerRef = doc(db, "users", uid);
    const buyerSnap = await getDoc(buyerRef);
    if (!buyerSnap.exists()) throw new Error("Buyer profile missing");
    const buyerData = buyerSnap.data() as UserProfile;
    const updatedSubs = [...(buyerData.subscribedSellerUids || []), sellerUid];
    const updatedBuyerBalance = buyerData.balance - price;

    await updateDoc(buyerRef, {
      subscribedSellerUids: updatedSubs,
      balance: updatedBuyerBalance
    });

    // 2. Add sub cost to seller's balance
    const sellerRef = doc(db, "users", sellerUid);
    const sellerSnap = await getDoc(sellerRef);
    if (sellerSnap.exists()) {
      await updateDoc(sellerRef, {
        balance: increment(price)
      });
    }

    return {
      ...buyerData,
      subscribedSellerUids: updatedSubs,
      balance: updatedBuyerBalance
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, buyerPath);
    throw error;
  }
}

// Toggle Wishlist listing for user
export async function toggleWishlist(uid: string, listingId: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Profile missing");
    const profile = snap.data() as UserProfile;
    
    let wishlist = profile.wishlistIds || [];
    if (wishlist.includes(listingId)) {
      wishlist = wishlist.filter(id => id !== listingId);
    } else {
      wishlist = [...wishlist, listingId];
    }
    
    await updateDoc(userRef, { wishlistIds: wishlist });
    return { ...profile, wishlistIds: wishlist };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Toggle Price Alert for a listing
export async function togglePriceAlert(uid: string, listingId: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Profile missing");
    const profile = snap.data() as UserProfile;
    
    let alerts = profile.priceAlertListingIds || [];
    if (alerts.includes(listingId)) {
      alerts = alerts.filter(id => id !== listingId);
    } else {
      alerts = [...alerts, listingId];
    }
    
    await updateDoc(userRef, { priceAlertListingIds: alerts });
    return { ...profile, priceAlertListingIds: alerts };
  } catch (error) {
    console.warn("Firestore error, fallback to local profile:", error);
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef).catch(() => null);
    const profile = snap?.data() as UserProfile || { uid } as UserProfile;
    let alerts = profile.priceAlertListingIds || [];
    if (alerts.includes(listingId)) {
      alerts = alerts.filter(id => id !== listingId);
    } else {
      alerts = [...alerts, listingId];
    }
    return { ...profile, priceAlertListingIds: alerts };
  }
}

// Update listing price (for price drops)
export async function updateListingPrice(listingId: string, newPrice: number): Promise<void> {
  const path = `listings/${listingId}`;
  try {
    const listingRef = doc(db, "listings", listingId);
    await updateDoc(listingRef, { price: newPrice });
  } catch (error) {
    console.warn("Firestore update error:", error);
  }
}

// Toggle Cart listing for user
export async function toggleCart(uid: string, listingId: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Profile missing");
    const profile = snap.data() as UserProfile;
    
    let cart = profile.cartIds || [];
    if (cart.includes(listingId)) {
      cart = cart.filter(id => id !== listingId);
    } else {
      cart = [...cart, listingId];
    }
    
    await updateDoc(userRef, { cartIds: cart });
    return { ...profile, cartIds: cart };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Checkout entire Shopping Cart (bulk buy)
export async function checkoutCart(uid: string, itemIds: string[], totalPrice: number, listingsList: Listing[]): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("Profile missing");
    const profile = snap.data() as UserProfile;
    
    const buyerFee = parseFloat((totalPrice * 0.01).toFixed(4));
    const totalBuyerCost = totalPrice + buyerFee;

    if (profile.balance < totalBuyerCost) {
      throw new Error(`Insufficient USDT balance. ${totalBuyerCost.toFixed(2)} USDT is required (including 1% platform fee) to checkout.`);
    }

    const updatedPurchased = [...(profile.purchasedItemIds || []), ...itemIds];
    const updatedBalance = parseFloat((profile.balance - totalBuyerCost).toFixed(4));
    
    // Update user profile (add purchases, deduct USDT, clear cart)
    await updateDoc(userRef, {
      purchasedItemIds: updatedPurchased,
      balance: updatedBalance,
      cartIds: []
    });

    // Process each item (increment sales, decrement stock, pay sellers)
    for (const itemId of itemIds) {
      const item = listingsList.find(l => l.id === itemId);
      if (item) {
        const itemRef = doc(db, "listings", itemId);
        const updates: any = { salesCount: increment(1) };
        if (item.stockCount !== undefined && item.stockCount > 0) {
          updates.stockCount = increment(-1);
        }
        await updateDoc(itemRef, updates);

        const itemSellerFee = parseFloat((item.price * 0.01).toFixed(4));
        const itemBuyerFee = parseFloat((item.price * 0.01).toFixed(4));
        const netSellerPayout = parseFloat((item.price - itemSellerFee).toFixed(4));

        // Pay the seller
        const sellerRef = doc(db, "users", item.sellerUid);
        const sellerSnap = await getDoc(sellerRef);
        let sellerName = item.sellerName || "Foot Creator";
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data() as UserProfile;
          sellerName = sellerData.displayName;
          await updateDoc(sellerRef, {
            balance: increment(netSellerPayout)
          });
        }

        // Record Order
        const orderId = `ord_${Date.now()}_${itemId}`;
        await setDoc(doc(db, "orders", orderId), {
          id: orderId,
          buyerId: uid,
          listingId: itemId,
          sellerUid: item.sellerUid,
          price: item.price,
          buyerFee: itemBuyerFee,
          sellerFee: itemSellerFee,
          createdAt: new Date().toISOString()
        });

        // Record platform fee in treasury doc
        await recordPlatformFee(
          'cart_purchase',
          uid,
          profile.displayName,
          item.sellerUid,
          sellerName,
          item.price,
          itemBuyerFee,
          itemSellerFee
        );
      }
    }

    return {
      ...profile,
      purchasedItemIds: updatedPurchased,
      balance: updatedBalance,
      cartIds: []
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Purchase single item
export async function purchaseItem(uid: string, listingId: string, price: number, sellerUid: string): Promise<UserProfile> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, "users", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const profile = docSnap.data() as UserProfile;
      const buyerFee = parseFloat((price * 0.01).toFixed(4));
      const sellerFee = parseFloat((price * 0.01).toFixed(4));
      const totalBuyerCost = price + buyerFee;
      
      if (profile.balance < totalBuyerCost) {
        throw new Error(`Insufficient USDT balance. ${totalBuyerCost.toFixed(2)} USDT is required (including 1% platform fee).`);
      }

      const updatedPurchased = [...(profile.purchasedItemIds || []), listingId];
      const updatedBalance = parseFloat((profile.balance - totalBuyerCost).toFixed(4));
      
      await updateDoc(userDocRef, {
        purchasedItemIds: updatedPurchased,
        balance: updatedBalance
      });

      // Increment sales & decrement stock if limited
      const listingDocRef = doc(db, "listings", listingId);
      const listingSnap = await getDoc(listingDocRef);
      if (listingSnap.exists()) {
        const itemData = listingSnap.data() as Listing;
        const updates: any = { salesCount: increment(1) };
        if (itemData.stockCount !== undefined && itemData.stockCount > 0) {
          updates.stockCount = increment(-1);
        }
        await updateDoc(listingDocRef, updates);
      }

      // Add to seller wallet (with 1% sale fee deducted)
      const sellerRef = doc(db, "users", sellerUid);
      const sellerSnap = await getDoc(sellerRef);
      let sellerName = "Foot Creator";
      const netSellerPayout = parseFloat((price - sellerFee).toFixed(4));

      if (sellerSnap.exists()) {
        const sellerData = sellerSnap.data() as UserProfile;
        sellerName = sellerData.displayName;
        await updateDoc(sellerRef, {
          balance: increment(netSellerPayout)
        });
      }

      // Record transaction
      const orderId = `ord_${Date.now()}`;
      await setDoc(doc(db, "orders", orderId), {
        id: orderId,
        buyerId: uid,
        listingId,
        sellerUid,
        price,
        buyerFee,
        sellerFee,
        createdAt: new Date().toISOString()
      });

      // Record platform fee in treasury doc
      await recordPlatformFee(
        'single_purchase',
        uid,
        profile.displayName,
        sellerUid,
        sellerName,
        price,
        buyerFee,
        sellerFee
      );

      return {
        ...profile,
        purchasedItemIds: updatedPurchased,
        balance: updatedBalance
      };
    }
    throw new Error("User profile not found");
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

// Toggle like
export async function toggleLikeListing(listingId: string, currentLikes: number, isLiked: boolean): Promise<number> {
  const diff = isLiked ? -1 : 1;
  const newLikes = currentLikes + diff;

  try {
    const listingDocRef = doc(db, "listings", listingId);
    await updateDoc(listingDocRef, {
      likes: increment(diff)
    });
  } catch (error) {
    console.warn("Failed to update like in firestore, using local fallback:", error);
  }
  return newLikes;
}

// Create custom request
export async function createCustomRequest(reqData: Omit<CustomRequest, "id" | "status" | "createdAt">): Promise<CustomRequest> {
  const newReq: CustomRequest = {
    ...reqData,
    id: `req_${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, "customRequests", newReq.id), newReq);
  } catch (error) {
    console.warn("Failed to save custom request in Firestore, saving locally:", error);
  }
  return newReq;
}

// Get user's custom requests
export async function getCustomRequests(senderId: string): Promise<CustomRequest[]> {
  try {
    const q = query(collection(db, "customRequests"), where("senderId", "==", senderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as CustomRequest);
  } catch (error) {
    console.warn("Failed to get custom requests from Firestore, using local fallback:", error);
    return [];
  }
}

// CHAT SYSTEM

// Get chats for a user (either buyer or seller)
export async function getChats(uid: string): Promise<Chat[]> {
  try {
    const chatsCol = collection(db, "chats");
    // Find chats where user is buyer
    const q1 = query(chatsCol, where("buyerUid", "==", uid));
    const snap1 = await getDocs(q1);
    const chats1 = snap1.docs.map(doc => doc.data() as Chat);

    // Find chats where user is seller
    const q2 = query(chatsCol, where("sellerUid", "==", uid));
    const snap2 = await getDocs(q2);
    const chats2 = snap2.docs.map(doc => doc.data() as Chat);

    // Combine and sort by updatedAt descending
    const combined = [...chats1, ...chats2];
    const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
    return unique.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    console.warn("Chat retrieval failed, loading simulated conversations:", error);
    return [];
  }
}

// Get messages for a specific chat room
export async function getMessages(chatId: string): Promise<Message[]> {
  try {
    const msgsCol = collection(db, "chats", chatId, "messages");
    const snapshot = await getDocs(msgsCol);
    const msgs = snapshot.docs.map(doc => doc.data() as Message);
    return msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch (error) {
    console.warn("Error getting messages:", error);
    return [];
  }
}

// Send a direct message
export async function sendMessage(
  chatId: string, 
  senderUid: string, 
  senderName: string, 
  content: string,
  receiverUid: string,
  receiverName: string
): Promise<Message> {
  const messageId = `msg_${Date.now()}`;
  const now = new Date().toISOString();

  const newMessage: Message = {
    id: messageId,
    chatId,
    senderUid,
    senderName,
    content,
    createdAt: now
  };

  try {
    // 1. Ensure the parent chat exists or update it
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);
    if (!chatSnap.exists()) {
      const isBuyer = senderUid !== receiverUid; // assume sender is buyer initially if first msg
      await setDoc(chatRef, {
        id: chatId,
        buyerUid: senderUid,
        buyerName: senderName,
        sellerUid: receiverUid,
        sellerName: receiverName,
        lastMessage: content,
        updatedAt: now
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: content,
        updatedAt: now
      });
    }

    // 2. Add message to messages subcollection
    const msgRef = doc(db, "chats", chatId, "messages", messageId);
    await setDoc(msgRef, newMessage);

    return newMessage;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages/${messageId}`);
    return newMessage;
  }
}

export interface TreasuryTxLog {
  id: string;
  type: 'single_purchase' | 'cart_purchase' | 'commission' | 'subscription';
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number; // original listing/commission price
  buyerFee: number;
  sellerFee: number;
  timestamp: string;
}

export interface PlatformTreasury {
  totalFeesCollected: number;
  totalBuyerFees: number;
  totalSellerFees: number;
  totalVolume: number;
  transactionCount: number;
  logs: TreasuryTxLog[];
}

// Get current platform treasury
export async function getPlatformTreasury(): Promise<PlatformTreasury> {
  try {
    const treasuryRef = doc(db, "platform", "treasury");
    const snap = await getDoc(treasuryRef);
    if (snap.exists()) {
      return snap.data() as PlatformTreasury;
    } else {
      // Default initial state
      const initial: PlatformTreasury = {
        totalFeesCollected: 0.00,
        totalBuyerFees: 0.00,
        totalSellerFees: 0.00,
        totalVolume: 0.00,
        transactionCount: 0,
        logs: []
      };
      await setDoc(treasuryRef, initial);
      return initial;
    }
  } catch (error) {
    console.warn("Treasury read failed, using simulated/fallback local treasury:", error);
    const stored = localStorage.getItem("solehaven_treasury");
    if (stored) {
      return JSON.parse(stored) as PlatformTreasury;
    }
    const fallback: PlatformTreasury = {
      totalFeesCollected: 1.60,
      totalBuyerFees: 0.80,
      totalSellerFees: 0.80,
      totalVolume: 80.00,
      transactionCount: 1,
      logs: [
        {
          id: "tx_init_1",
          type: "single_purchase",
          buyerId: "buyer_demo",
          buyerName: "Whale collector",
          sellerId: "seller_demo",
          sellerName: "SoleHaven Queen",
          amount: 80.00,
          buyerFee: 0.80,
          sellerFee: 0.80,
          timestamp: new Date().toISOString()
        }
      ]
    };
    localStorage.setItem("solehaven_treasury", JSON.stringify(fallback));
    return fallback;
  }
}

// Log a transaction fee in treasury
export async function recordPlatformFee(
  type: TreasuryTxLog['type'],
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  amount: number,
  buyerFee: number,
  sellerFee: number
): Promise<void> {
  try {
    const treasuryRef = doc(db, "platform", "treasury");
    const snap = await getDoc(treasuryRef);
    let current: PlatformTreasury;
    if (snap.exists()) {
      current = snap.data() as PlatformTreasury;
    } else {
      current = {
        totalFeesCollected: 0,
        totalBuyerFees: 0,
        totalSellerFees: 0,
        totalVolume: 0,
        transactionCount: 0,
        logs: []
      };
    }

    const newLog: TreasuryTxLog = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      amount: parseFloat(amount.toFixed(2)),
      buyerFee: parseFloat(buyerFee.toFixed(2)),
      sellerFee: parseFloat(sellerFee.toFixed(2)),
      timestamp: new Date().toISOString()
    };

    const updated: PlatformTreasury = {
      totalFeesCollected: parseFloat((current.totalFeesCollected + buyerFee + sellerFee).toFixed(4)),
      totalBuyerFees: parseFloat((current.totalBuyerFees + buyerFee).toFixed(4)),
      totalSellerFees: parseFloat((current.totalSellerFees + sellerFee).toFixed(4)),
      totalVolume: parseFloat((current.totalVolume + amount).toFixed(2)),
      transactionCount: current.transactionCount + 1,
      logs: [newLog, ...(current.logs || [])].slice(0, 100) // limit to 100 logs
    };

    await setDoc(treasuryRef, updated);
    localStorage.setItem("solehaven_treasury", JSON.stringify(updated));
  } catch (error) {
    console.warn("Failed to write to Firestore treasury, updating local storage:", error);
    const stored = localStorage.getItem("solehaven_treasury");
    let current: PlatformTreasury = stored ? JSON.parse(stored) : {
      totalFeesCollected: 0,
      totalBuyerFees: 0,
      totalSellerFees: 0,
      totalVolume: 0,
      transactionCount: 0,
      logs: []
    };
    const newLog: TreasuryTxLog = {
      id: `tx_${Date.now()}_local`,
      type,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      amount: parseFloat(amount.toFixed(2)),
      buyerFee: parseFloat(buyerFee.toFixed(2)),
      sellerFee: parseFloat(sellerFee.toFixed(2)),
      timestamp: new Date().toISOString()
    };
    const updated: PlatformTreasury = {
      totalFeesCollected: parseFloat((current.totalFeesCollected + buyerFee + sellerFee).toFixed(4)),
      totalBuyerFees: parseFloat((current.totalBuyerFees + buyerFee).toFixed(4)),
      totalSellerFees: parseFloat((current.totalSellerFees + sellerFee).toFixed(4)),
      totalVolume: parseFloat((current.totalVolume + amount).toFixed(2)),
      transactionCount: current.transactionCount + 1,
      logs: [newLog, ...(current.logs || [])].slice(0, 100)
    };
    localStorage.setItem("solehaven_treasury", JSON.stringify(updated));
  }
}
