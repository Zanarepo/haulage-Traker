import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force Node.js runtime for crypto access
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/paystack/webhook
 * Handles Paystack webhook events.
 * 
 * Key events:
 * - charge.success → Upgrade the company's plan
 * - subscription.disable → Downgrade to free
 */
export async function POST(request: NextRequest) {
    try {
        // Lazy-init admin client inside handler to avoid build-time env issues
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const body = await request.text();
        const signature = request.headers.get('x-paystack-signature');

        // Verify webhook signature using Node.js crypto
        const { createHmac } = await import('node:crypto');
        const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
            .update(body)
            .digest('hex');

        if (hash !== signature) {
            console.error('Invalid Paystack webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        console.log('Paystack webhook event:', event.event);

        switch (event.event) {
            case 'charge.success': {
                const { metadata, customer } = event.data;
                const companyId = metadata?.company_id;
                const plan = metadata?.plan;

                if (!companyId || !plan) {
                    console.error('Missing metadata in charge.success');
                    break;
                }

                // Upgrade the subscription immediately
                const now = new Date().toISOString();
                const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

                const { error } = await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        plan,
                        status: 'active',
                        current_period_start: now,
                        current_period_end: periodEnd,
                        paystack_customer_code: customer?.customer_code || null,
                        updated_at: now,
                    })
                    .eq('company_id', companyId);

                if (error) {
                    console.error('Failed to upgrade subscription:', error);
                } else {
                    console.log(`✅ Company ${companyId} upgraded to ${plan}`);
                }
                break;
            }

            case 'subscription.disable':
            case 'subscription.not_renew': {
                const customerCode = event.data?.customer?.customer_code;
                if (!customerCode) break;

                // Find the subscription by Paystack customer code and downgrade
                const { error } = await supabaseAdmin
                    .from('subscriptions')
                    .update({
                        plan: 'free',
                        status: 'expired',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('paystack_customer_code', customerCode);

                if (error) {
                    console.error('Failed to downgrade subscription:', error);
                } else {
                    console.log(`⬇️ Customer ${customerCode} downgraded to free`);
                }
                break;
            }

            default:
                console.log('Unhandled Paystack event:', event.event);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
