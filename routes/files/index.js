const express = require('express');
const multer = require('multer');
const path = require('path');
const post = require('./post');
const list = require('./list');
const del = require('./del');
const get = require('./get');
const download = require('./download');
const put = require('./put');
const authMiddleware = require('../../middleware/auth');

const router = express.Router();

function files(db) {
	// Проверка авторизации
	router.use(authMiddleware(db));

	const uploads = process.env.UPLOAD_DIR || 'uploads';
	const storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, uploads);
		},
		filename: function (req, file, cb) {
			const timestamp = Date.now();
			const ext = path.extname(file.originalname);
			const base = path.basename(file.originalname, ext);
			const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, '_');
			cb(null, `${safeBase}_${timestamp}${ext}`);
		},
	});
	const upload = multer({ storage });

	// /file/upload [POST] добавление нового файла в систему и запись параметров файла в базу: название, расширение, MIME type, размер, дата загрузки
	router.post('/upload', upload.single('file'), post(db));

	// /file/list [GET] выводит список файлов и их параметров из базы с использованием пагинации с размером страницы, указанного
	// в передаваемом параметре list_size, по умолчанию 10 записей на страницу, если параметр пустой. Номер страницы указан в параметре page, по умолчанию 1, если не задан;
	router.get('/list', list(db));

	// /file/delete/:id [DELETE] удаляет документ из базы и локального хранилища;
	router.delete('/delete/:id', del(db));

	// /file/:id [GET] вывод информации о выбранном файле;
	router.get('/:id', get(db));

	// /file/download/:id [GET] скачивание конкретного файла;
	router.get('/download/:id', download(db));

	// /file/update/:id [PUT] обновление текущего документа на новый в базе и локальном хранилище;
	router.put('/update/:id', upload.single('file'), put(db));

	return router;
}
module.exports = files;
