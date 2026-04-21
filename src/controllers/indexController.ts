import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { User } from '../generated/prisma/client';

export const indexGet = async (req: Request, res: Response) => {
  const errors = req.flash('error');

  if (req.isAuthenticated()) {
    const user = req.user as User;
    const files = await prisma.file.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.render('index', {
      errors,
      files,
    });
  }

  res.render('index', {
    errors,
  });
};
