/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { image } = body;

        if (!image) {
            return NextResponse.json(
                { success: false, error: 'No image provided' },
                { status: 400 }
            );
        }

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Cloudinary is not configured. Please add credentials to your .env file.'
                },
                { status: 500 }
            );
        }

        // Upload image to Cloudinary
        const imageUrl = await uploadImage(image, 'food-items');

        return NextResponse.json({
            success: true,
            imageUrl
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to upload image' },
            { status: 500 }
        );
    }
}
