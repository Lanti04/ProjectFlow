import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    let token;

    //checking for token in headers
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        //verifying the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-very-long-string');

        //attach userId to req.
        req.user = { userId: decoded.userId };

        next();  //we continue to troute
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};