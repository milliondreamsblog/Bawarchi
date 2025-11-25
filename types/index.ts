// Item type definition
export interface Item {
    _id: string;
    name: string;
    description?: string;
    price: number;
    category?: string;
    calories?: number;
    image?: string;
    available: boolean;
    restaurantId: string;
}

// Restaurant type definition
export interface Restaurant {
    _id: string;
    name: string;
    slug: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    description?: string;
    gstPercentage?: number; // 0, 5, 12, or 18
}

// Order type definition
export interface Order {
    _id: string;
    tableNumber: number;
    items: OrderItem[];
    totalAmount: number;
    // New billing breakdown fields
    baseTotal?: number; // Sum of item prices
    gstPercentage?: number; // Snapshot of restaurant's GST % at order time
    gstAmount?: number; // Calculated GST
    platformFee?: number; // 2% of (baseTotal + gstAmount)
    finalAmount?: number; // baseTotal + gstAmount + platformFee
    restaurantEarnings?: number; // finalAmount - platformFee
    myEarnings?: number; // platformFee
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected';
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
}
