import express from 'express';
import { prisma } from './lib/prisma';

const app = express();

app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  const sessions = await prisma.session.findMany();
  res.json(sessions);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
