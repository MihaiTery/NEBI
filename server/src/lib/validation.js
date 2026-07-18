'use strict';

const { z } = require('zod');

const configSchema = z.object({
    extraLevels: z.number().int().nonnegative(),
    sisalCount: z.number().int().nonnegative(),
    ropeCount: z.number().int().nonnegative()
});

const addressSchema = z.object({
    county: z.string().trim().min(1).max(100),
    city: z.string().trim().min(1).max(100),
    address: z.string().trim().min(1).max(300),
    postalCode: z.string().trim().min(3).max(20)
});

const emailSchema = z.string().trim().email().max(200);
const phoneSchema = z.string().trim().min(6).max(30);

const checkoutSchema = z.object({
    config: configSchema,

    customerType: z.enum(['individual', 'company']),

    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),

    companyName: z.string().trim().min(1).max(200).optional(),
    cui: z.string().trim().min(1).max(30).optional(),
    regCom: z.string().trim().max(30).optional(),

    email: emailSchema,
    phone: phoneSchema,

    shipping: addressSchema,

    billingSameAsShipping: z.boolean(),
    billing: z.object({
        companyName: z.string().trim().max(200).optional(),
        cui: z.string().trim().max(30).optional(),
        regCom: z.string().trim().max(30).optional(),
        county: z.string().trim().min(1).max(100),
        city: z.string().trim().min(1).max(100),
        address: z.string().trim().min(1).max(300),
        postalCode: z.string().trim().min(3).max(20),
        contactName: z.string().trim().max(150).optional(),
        contactEmail: emailSchema.optional(),
        contactPhone: phoneSchema.optional()
    }).optional(),

    notes: z.string().trim().max(1000).optional(),

    acceptedTerms: z.literal(true),
    acceptedRefundPolicy: z.literal(true),
    confirmedConfig: z.literal(true)
}).superRefine((data, ctx) => {
    if (data.customerType === 'individual') {
        if (!data.firstName || !data.lastName) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nume și prenume sunt obligatorii pentru persoană fizică.', path: ['firstName'] });
        }
    } else {
        if (!data.companyName || !data.cui) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Denumirea societății și CUI sunt obligatorii pentru persoană juridică.', path: ['companyName'] });
        }
    }
    if (!data.billingSameAsShipping && !data.billing) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Adresa de facturare este obligatorie când diferă de cea de livrare.', path: ['billing'] });
    }
    if (data.customerType === 'company' && !data.billing) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Datele de facturare (CUI, denumire societate) sunt obligatorii pentru persoană juridică.', path: ['billing'] });
    }
});

module.exports = { checkoutSchema, configSchema };
