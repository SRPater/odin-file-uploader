import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { User } from '../generated/prisma/client';

export const indexGet = async (req: Request, res: Response) => {
  const errors = req.flash('error');

  if (req.isAuthenticated()) {
    const user = req.user as User;
    const rawFiles = await prisma.file.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const files = rawFiles.map(file => {
      let iconClass = 'file-text';

      if (file.mimeType.startsWith('image/')) {
        iconClass = 'file-image';
      } else if (file.mimeType.startsWith('video/')) {
        iconClass = 'file-video-camera';
      } else if (file.mimeType.startsWith('audio/')) {
        iconClass = 'file-music';
      } else if (
        file.mimeType === 'application/vnd.ms-excel' ||
        file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        iconClass = 'file-spreadsheet';
      } else if (
        file.mimeType === 'application/vnd.ms-powerpoint' ||
        file.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ) {
        iconClass = 'file-chart-column'
      }

      return { ...file, iconClass };
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
