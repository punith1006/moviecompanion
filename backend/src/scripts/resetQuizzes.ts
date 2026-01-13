import mongoose from 'mongoose';
import { config } from '../config/environment';
import { QuizScore } from '../models/QuizScore';

const reset = async () => {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');

        const result = await QuizScore.deleteMany({});
        console.log(`Deleted ${result.deletedCount} quiz scores.`);

        await mongoose.disconnect();
        console.log('Disconnected');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

reset();
