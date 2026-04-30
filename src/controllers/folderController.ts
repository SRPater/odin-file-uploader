import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

export const createGet = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render('createFolder');
};

export const createPost = [
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.redirect('/');
    next();
  },
  body('name')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('The folder name must contain between 3 and 20 characters.'),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('createFolder', {
        errors: errors.array(),
        prevData: req.body,
      });
    }

    try {
      const user = req.user as { id: number };
      const ownerId = user.id;
      const folder = await prisma.folder.create({
        data: {
          name: req.body.name,
          ownerId,
        },
      });

      res.redirect('/');
    } catch (err) {
      let msg = 'An error occurred while creating the folder.';

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        msg = 'A folder with this name already exists.';
      }

      res.render('createFolder', { errors: [{ msg }] });
    }
  },
];
