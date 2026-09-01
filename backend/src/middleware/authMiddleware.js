// ========== AUTHENTICATION MIDDLEWARE ==========
// Protects routes by verifying JWT tokens from Authorization header
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler.js';

// ========== PROTECT MIDDLEWARE ==========
// Extracts & validates JWT token, attaches userId to request
export const protect = async (req, res, next) => {
    let token;

    //checking for token in headers
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized, no token');
    }

    try {
        //verifying the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-very-long-string');

        //attach userId to req.
        req.user = { userId: decoded.userId };

        next();  //we continue to troute
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Token expired');
        }
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid token');
        }
        throw error;
    }
};