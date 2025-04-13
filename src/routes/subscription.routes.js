import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { toggleSubscription,
        getUserChannelSubscribers,
        getSubscribedChannels } from "../controllers/subscripiton.controller";

const router = Router();
router.use(verifyJWT);

router
    .route("/c1/:channelId")
    .get(getUserChannelSubscribers)
    .post(toggleSubscription)

router
    .route("/c2/:subscriberId")
    .get(getSubscribedChannels)

export default router