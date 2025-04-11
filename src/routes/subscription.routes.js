import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { toggleSubscription,
        getUserChannelSubscribers,
        getSubscribedChannels } from "../controllers/subscripiton.controller";

const router = Router();
router.use(verifyJWT);

router
    .route("/c/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription)

router
    .route("/c/:subscriberId")
    .get(getSubscribedChannels)

export default router