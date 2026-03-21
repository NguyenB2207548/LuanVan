import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface CartState {
    cartCount: number;
    fetchCartCount: () => Promise<void>;
    updateCartCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
    cartCount: 0,
    updateCartCount: (count) => set({ cartCount: count }),
    fetchCartCount: async () => {
        try {
            const res = await axiosClient.get('/carts/count'); // Giả sử backend có endpoint này
            set({ cartCount: res.data.count || 0 });
        } catch (error) {
            console.error("Error fetching cart count", error);
        }
    },
}));