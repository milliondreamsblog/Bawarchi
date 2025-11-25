/**
 * Billing Calculation Utilities
 * Centralized functions for GST and platform fee calculations
 */

export interface BillingBreakdown {
    baseTotal: number;
    gstPercentage: number;
    gstAmount: number;
    platformFee: number;
    finalAmount: number;
    restaurantEarnings: number;
    myEarnings: number;
}

/**
 * Calculate GST amount based on base total and GST percentage
 * @param baseTotal - The sum of all item prices
 * @param gstPercentage - GST percentage (0, 5, 12, or 18)
 * @returns GST amount rounded to 2 decimal places
 */
export function calculateGST(baseTotal: number, gstPercentage: number): number {
    if (gstPercentage < 0 || ![0, 5, 12, 18].includes(gstPercentage)) {
        throw new Error(`Invalid GST percentage: ${gstPercentage}. Must be 0, 5, 12, or 18.`);
    }
    const gstAmount = (baseTotal * gstPercentage) / 100;
    return Math.round(gstAmount * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate platform fee (2% of baseTotal + gstAmount)
 * @param baseTotal - The sum of all item prices
 * @param gstAmount - The GST amount
 * @returns Platform fee rounded to 2 decimal places
 */
export function calculatePlatformFee(baseTotal: number, gstAmount: number): number {
    const platformFeePercentage = 2;
    const platformFee = ((baseTotal + gstAmount) * platformFeePercentage) / 100;
    return Math.round(platformFee * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate complete billing breakdown
 * @param baseTotal - The sum of all item prices
 * @param gstPercentage - GST percentage (0, 5, 12, or 18)
 * @returns Complete billing breakdown with all amounts
 */
export function calculateBillingBreakdown(
    baseTotal: number,
    gstPercentage: number
): BillingBreakdown {
    // Validate inputs
    if (baseTotal < 0) {
        throw new Error("Base total cannot be negative");
    }

    const gstAmount = calculateGST(baseTotal, gstPercentage);
    const platformFee = calculatePlatformFee(baseTotal, gstAmount);
    const finalAmount = Math.round((baseTotal + gstAmount + platformFee) * 100) / 100;
    const restaurantEarnings = Math.round((finalAmount - platformFee) * 100) / 100;
    const myEarnings = platformFee;

    return {
        baseTotal: Math.round(baseTotal * 100) / 100,
        gstPercentage,
        gstAmount,
        platformFee,
        finalAmount,
        restaurantEarnings,
        myEarnings,
    };
}

/**
 * Format currency amount for display
 * @param amount - Amount to format
 * @returns Formatted string with ₹ symbol
 */
export function formatCurrency(amount: number): string {
    return `₹${amount.toFixed(2)}`;
}
