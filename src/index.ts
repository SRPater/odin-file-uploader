import 'dotenv/config';
import path from 'node:path';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import flash from 'connect-flash';

import { prisma } from './lib/prisma';
import authRouter from './routes/authRouter';
import './config/passport';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(import.meta.dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(import.meta.dirname, 'public')));

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000
    },
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(
      prisma,
      {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      },
    ),
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/', authRouter);

app.get('/', (req, res) => {
  res.render('index', {
    errors: req.flash('error'),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
