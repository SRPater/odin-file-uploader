import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';

export const signUpGet = (req: Request, res: Response) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('sign-up');
}

export const signUpPost = [
  (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return res.redirect('/');
    next();
  },
  body('username')
    .trim()
    .isAlphanumeric()
    .withMessage('Your username must only contain letters and numbers.')
    .isLength({ min: 3, max: 20 })
    .withMessage('Your username must contain between 3 and 20 characters.'),
  body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Your password must contain at least 8 characters.'),
  body('confirm')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('The passwords do not match.');
      }

      return true;
    }),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('sign-up', {
        errors: errors.array(),
        prevData: req.body,
      });
    }

    try {
      const hash = await bcrypt.hash(req.body.password, 10);
      const user = await prisma.user.create({
        data: {
          username: req.body.username,
          password: hash,
        },
      });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.redirect('/');
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
          return res.render('sign-up', {
            errors: [{ msg: 'That username is already taken.' }],
            prevData: req.body,
          });
        }
      }

      next(err);
    }
  },
];

export const logInPost = passport.authenticate(
  'local',
  {
    successRedirect: '/',
    failureRedirect: '/',
    failureFlash: true,
  }
);

export const logOutGet = (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
};
