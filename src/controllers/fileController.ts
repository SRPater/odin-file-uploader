import { Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import { Prisma } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';
import { upload } from '../config/multer';


export const uploadGet = (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/');
  res.render('upload');
};

export const uploadPost = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  upload.single('file')(req, res, async (err) => {
    if (err) {
      const msg = (
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE'
      ) ? 'The file is too large. The maximum size is 10 MB.' : err.message;

      return res.render('upload', { errors: [{ msg }] });
    }

    if (!req.file) {
      return res.render(
        'upload',
        { errors: [
          { msg: 'Please select a file to upload.' },
        ]},
      );
    }

    try {
      const user = req.user as { id: number };
      const ownerId = user.id;

      const rootFolder = await prisma.folder.upsert({
        where: {
          name_ownerId: {
            name: 'root',
            ownerId,
          }
        },
        update: {},
        create: {
          name: 'root',
          ownerId,
        },
      });

      await prisma.file.create({
        data: {
          name: req.file.originalname,
          url: req.file.path,
          size: req.file.size,
          mimeType: req.file.mimetype,
          ownerId,
          folderId: rootFolder.id,
        },
      });

      res.redirect('/');
    } catch (err) {
      if (req.file?.path) {
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Failed to delete ghost file:', unlinkErr);
          }
        });
      }

      console.error(err);
      let msg = 'An error occurred while saving the file.';

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        msg = 'A file with this name already exists in this folder.';
      }

      res.render('upload', { errors: [{ msg }] });
    }
  });
};
