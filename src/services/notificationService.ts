import { supabase } from '@/lib/supabase';

export interface Notification {
    id: string;
    company_id: string;
    user_id: string;
    type: string;
    module: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const notificationService = {
    async createNotification(notification: Omit<Notification, 'id' | 'is_read' | 'created_at'>) {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getNotifications(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async markRead(notificationId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return true;
    },

    async markAllRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return true;
    },

    async getUnreadCounts(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('module')
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        const counts: Record<string, number> = {};
        (data || []).forEach(n => {
            counts[n.module] = (counts[n.module] || 0) + 1;
        });

        return counts;
    }
};
