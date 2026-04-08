import { useState, useEffect, useCallback } from "react";
import axiosClient from "@/api/axiosClient";

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await axiosClient.get("/notifications/unread-count");
            setUnreadCount(res.data);
        } catch { }
    }, []);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get("/notifications?limit=15");
            setNotifications(res.data.data || []);
            setUnreadCount(res.data.meta.unreadCount);
        } catch { } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (id: number) => {
        await axiosClient.patch(`/notifications/${id}/read`);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await axiosClient.patch("/notifications/read-all");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    // Poll unread count mỗi 30 giây
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30_000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return {
        notifications, unreadCount, loading,
        fetchNotifications, markAsRead, markAllAsRead,
    };
};