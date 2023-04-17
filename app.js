const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');


const indexRouter = require('./routes/index');

const app = express();
app.set('port', process.env.NODE_ENV || 3000);

dotenv.config();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.use((req, res, next) => {
    const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
})

app.listen(app.get('port'), () => {
    console.log(app.get('port'), '번 포트에서 요청 대기 중');
})

module.exports = app;
