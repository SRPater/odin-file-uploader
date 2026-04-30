import { Router } from 'express';
import * as folderController from '../controllers/folderController';

const folderRouter = Router();

folderRouter.get('/create', folderController.createGet);
folderRouter.post('/create', folderController.createPost);

export default folderRouter;
