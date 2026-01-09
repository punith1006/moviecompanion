import mongoose, { Document, Schema } from 'mongoose';

export type WatchStatus = 'watched' | 'watching' | 'dropped' | 'not_interested';
export type ContentType = 'movie' | 'tv';

export interface IWatchHistory extends Document {
    userId: mongoose.Types.ObjectId;
    contentId: string;
    contentType: ContentType;
    status: WatchStatus;
    rating?: number;
    episodeProgress?: {
        season: number;
        episode: number;
    };
    title: string;
    posterPath?: string;
    genres?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const watchHistorySchema = new Schema<IWatchHistory>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        contentId: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ['movie', 'tv'],
            required: true,
        },
        status: {
            type: String,
            enum: ['watched', 'watching', 'dropped', 'not_interested'],
            required: true,
        },
        rating: {
            type: Number,
            min: 1,
            max: 10,
        },
        episodeProgress: {
            season: { type: Number },
            episode: { type: Number },
        },
        title: {
            type: String,
            required: true,
        },
        posterPath: {
            type: String,
        },
        genres: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Compound index to ensure one entry per user per content
watchHistorySchema.index({ userId: 1, contentId: 1 }, { unique: true });

export const WatchHistory = mongoose.model<IWatchHistory>(
    'WatchHistory',
    watchHistorySchema
);
