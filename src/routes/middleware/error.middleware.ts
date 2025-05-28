import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = () => {
    const middlewareFn = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);
        res.status(500).send('Internal server error');
    };
    return middlewareFn;
};
