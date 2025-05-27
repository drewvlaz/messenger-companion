import express from 'express';
const webhooks = express.Router();
webhooks.post('/', (req, res) => {
    console.log(req.body);
    res.sendStatus(200);
});
export default webhooks;
