import { Router } from 'express';
import * as indexController from '../controllers/indexController';

const indexRouter = Router();

indexRouter.get('/', indexController.indexGet);

export default indexRouter;
