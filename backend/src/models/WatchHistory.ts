import mongoose, { Schema, Document } from 'mongoose';

export type WatchStatus = 'watching' | 'completed' | 'dropped' | 'want_to_watch';
export type ContentType = 'movie' | 'series';

export interface IWatchHistory extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    tmdbId: number;
    title: string;
    type: ContentType;
    platform: string;
    status: WatchStatus;
    progress?: {
        season?: number;
        episode?: number;
        percentage?: number;
    };
    rating?: number;
    notes?: string;
    genres: string[];
    posterUrl?: string;
    backdropUrl?: string;
    savedQuotes: Array<{
        quote: string;
        character: string;
        season?: number;
        episode?: number;
        addedAt: Date;
    }>;
    firstWatchedAt: Date;
    lastWatchedAt: Date;
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
        tmdbId: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['movie', 'series'],
            required: true,
        },
        platform: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['watching', 'completed', 'dropped', 'want_to_watch'],
            default: 'watching',
        },
        progress: {
            season: { type: Number },
            episode: { type: Number },
            percentage: { type: Number },
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        notes: {
            type: String,
            maxlength: 1000,
        },
        genres: [{ type: String }],
        posterUrl: { type: String },
        backdropUrl: { type: String },
        savedQuotes: [
            {
                quote: { type: String, required: true },
                character: { type: String, required: true },
                season: { type: Number },
                episode: { type: Number },
                addedAt: { type: Date, default: Date.now },
            },
        ],
        firstWatchedAt: {
            type: Date,
            default: Date.now,
        },
        lastWatchedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient queries
watchHistorySchema.index({ userId: 1, tmdbId: 1 }, { unique: true });
watchHistorySchema.index({ userId: 1, status: 1 });
watchHistorySchema.index({ userId: 1, lastWatchedAt: -1 });

export const WatchHistory = mongoose.model<IWatchHistory>(
    'WatchHistory',
    watchHistorySchema
);
