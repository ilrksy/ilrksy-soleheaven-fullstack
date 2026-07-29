import { Listing, Review } from '../types';

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: "lst_artistic_mono",
    title: "Monokrom Estetis (Aesthetic Monochrome)",
    description: "Seni fotografi monokrom kelas tinggi dengan fokus pada keindahan siluet kaki, bayangan dramatis, dan sudut estetik. Cocok untuk kolektor seni rupa halus.",
    price: 15.00,
    category: "Artistic",
    imageUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=450&q=80",
    mediaType: "image",
    sellerName: "Luna Clarissa",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
    sellerUid: "usr_luna_demo",
    likes: 42,
    salesCount: 18,
    views: 312,
    stockCount: 10, // 10 copies max
    createdAt: "2026-06-25T10:00:00Z"
  },
  {
    id: "lst_beach_sunset",
    title: "Senja Keemasan Pantai (Golden Sunset Beach)",
    description: "Langkah lembut di atas pasir pantai basah berhiaskan buih ombak sore hari yang berkilau di bawah siraman matahari terbenam. Estetika alam yang menenangkan.",
    price: 22.50,
    category: "Beach",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=450&q=80",
    mediaType: "image",
    sellerName: "Amara SoleArt",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Amara",
    sellerUid: "usr_amara_demo",
    likes: 89,
    salesCount: 34,
    views: 520,
    createdAt: "2026-06-28T14:30:00Z" // Unlimited stock
  },
  {
    id: "lst_beach_video_loop",
    title: "Ombak Pasir Gelung Video (Ocean Wave Footsteps Loop)",
    description: "Video gelung (loop) resolusi tinggi memaparkan buih air laut sejuk membasahi jemari kaki di tepian pantai berpasir halus secara perlahan. Sangat terapeutik.",
    price: 35.00,
    category: "Beach",
    imageUrl: "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1437719417032-8595fd9e9dc6?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-waves-breaking-on-the-shore-from-above-41223-large.mp4",
    mediaType: "video",
    sellerName: "Amara SoleArt",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Amara",
    sellerUid: "usr_amara_demo",
    likes: 121,
    salesCount: 42,
    views: 890,
    stockCount: 5, // only 5 copies!
    createdAt: "2026-07-02T10:00:00Z"
  },
  {
    id: "lst_silk_luxury",
    title: "Sutra Mewah Pagi (Luxurious Morning Silk)",
    description: "Kaki yang bersandar lembut di atas sprei sutra berkualitas premium berwarna krem hangat di pagi hari, menangkap pencahayaan alami yang lembut dan mewah.",
    price: 30.00,
    category: "Silk",
    imageUrl: "https://images.unsplash.com/photo-1519415590266-607eda262b2f?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1519415590266-607eda262b2f?auto=format&fit=crop&w=600&h=450&q=80",
    mediaType: "image",
    sellerName: "Bella PediEsthetic",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
    sellerUid: "usr_bella_demo",
    likes: 124,
    salesCount: 56,
    views: 789,
    isSubscriberOnly: true, // Only for subscribers
    createdAt: "2026-07-01T08:15:00Z"
  },
  {
    id: "lst_pedicure_video_loop",
    title: "Urutan Terapi & Pedikur Gelung (Pedi-Massage Therapy Loop)",
    description: "Klip video berkualiti tinggi merakamkan sesi rawatan pembersihan dan sapuan minyak pati aromaterapi pada kuku kaki, mempamerkan kilauan kuku merah anggun.",
    price: 45.00,
    category: "Pedicure",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&h=450&q=80",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-applying-moisturizer-on-her-legs-39999-large.mp4",
    mediaType: "video",
    sellerName: "Bella PediEsthetic",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
    sellerUid: "usr_bella_demo",
    likes: 135,
    salesCount: 29,
    views: 644,
    createdAt: "2026-07-03T02:00:00Z"
  },
  {
    id: "lst_flowers_water",
    title: "Kelopak Mawar Air Jernih (Rose Petal Water)",
    description: "Foto artistik kaki yang berendam manja di air jernih dengan kelopak bunga mawar warna-warni yang mengapung, menciptakan riak-riak air estetik yang jernih.",
    price: 25.00,
    category: "Floral",
    imageUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&h=450&q=80",
    originalUrl: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=600&h=450&q=80",
    mediaType: "image",
    sellerName: "Luna Clarissa",
    sellerAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
    sellerUid: "usr_luna_demo",
    likes: 67,
    salesCount: 22,
    views: 405,
    createdAt: "2026-07-02T11:45:00Z"
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev1",
    listingId: "lst_silk_luxury",
    userName: "Andi Wijaya",
    rating: 5,
    comment: "Kualiti foto luar biasa jernih! Sangat estetik dan pencahayaan sutera pagi yang memukau. Berbaloi dengan harga USDT yang dibayar.",
    createdAt: "2026-07-01T12:00:00Z"
  },
  {
    id: "rev2",
    listingId: "lst_silk_luxury",
    userName: "CryptoWhale_MY",
    rating: 5,
    comment: "Bella sememangnya pencipta terbaik. Suka gila tengok kuku dan hiasan premium ini. Sangat berpuas hati!",
    createdAt: "2026-07-02T15:30:00Z"
  },
  {
    id: "rev3",
    listingId: "lst_beach_sunset",
    userName: "Chandra_Art",
    rating: 4,
    comment: "Sangat suka dengan nuansa sunset pantai. Langkah kaki nampak sangat semulajadi di atas pasir basah.",
    createdAt: "2026-06-29T18:45:00Z"
  }
];
