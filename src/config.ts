import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: 3003,
    env: process.env,
};
