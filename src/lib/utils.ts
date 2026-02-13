export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}

export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'NGN',
    }).format(value);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date));
}
