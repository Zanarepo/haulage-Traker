import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/paystack/initialize
 * Creates a Paystack transaction for plan upgrade.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, amount, plan, company_id } = body;

        if (!email || !amount || !plan || !company_id) {
            return NextResponse.json(
                { error: 'Missing required fields: email, amount, plan, company_id' },
                { status: 400 }
            );
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount, // In kobo
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`,
                metadata: {
                    company_id,
                    plan,
                    custom_fields: [
                        { display_name: 'Plan', variable_name: 'plan', value: plan },
                        { display_name: 'Company ID', variable_name: 'company_id', value: company_id },
                    ],
                },
            }),
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message || 'Paystack error' }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Paystack initialize error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
