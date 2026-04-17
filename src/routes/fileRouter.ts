import { Router } from 'express';
import * as fileController from '../controllers/fileController';

const fileRouter = Router();

fileRouter.get('/upload', fileController.uploadGet);
fileRouter.post('/upload', fileController.uploadPost);

export default fileRouter;
