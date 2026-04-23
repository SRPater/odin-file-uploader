import { Request, Response } from 'express';
import multer from 'multer';
import { unlink } from 'node:fs/promises';
import { Prisma } from '../generated/prisma/client';
import type { User } from '../generated/prisma/client';
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
        await unlink(req.file.path)
          .catch(e => console.error("Ghost file cleanup failed:", e));
      }

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

export const downloadGet = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const { id } = req.params;
  const fileId = parseInt(id as string, 10);
  const user = req.user as User;
  const file = await prisma.file.findUnique({
    where: {
      id: fileId,
      ownerId: user.id,
    },
  });

  if (!file) return res.redirect('/');
  res.download(file.url, file.name);
};

export const deletePost = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) return res.redirect('/');

  const { id } = req.params;
  const fileId = parseInt(id as string, 10);
  const user = req.user as User;

  try {
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        ownerId: user.id,
      },
    });

    if (!file) return res.redirect('/');
    await unlink(file.url)
      .catch(e => console.error("Physical file already gone:", e));
    
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};
