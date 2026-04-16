import { Router } from 'express';
import * as authController from '../controllers/authController';

const authRouter = Router();

authRouter.get('/sign-up', authController.signUpGet);
authRouter.post('/sign-up', authController.signUpPost);

authRouter.get('/log-out', authController.logOutGet);

export default authRouter;
