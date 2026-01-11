import mongoose from 'mongoose';
import { config } from './environment';

export async function connectDatabase(): Promise<void> {
    try {
        mongoose.set('strictQuery', true);

        await mongoose.connect(config.mongodbUri);

        console.log('✅ MongoDB connected successfully');

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    console.log('MongoDB disconnected gracefully');
}
