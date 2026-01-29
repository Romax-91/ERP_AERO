const express = require('express');
const authMiddleware = require('../../middleware/auth');
const signup = require('./signup');
const signin = require('./signin');
const refresh = require('./refresh');
const { revokeByAccessJti } = require('../../tool/token');

const router = express.Router();

function auth(db) {
	// регистрация нового пользователя
	router.post('/signup', signup(db));

	//запрос jwt-токена по id и паролю
	router.post('/signin', signin(db));

	//обновление jwt-токена по refresh токену
	router.post('/signin/new_token', refresh(db));

	// выйти из системы
	router.get('/logout', authMiddleware(db), async (req, res) => {
		try {
			await revokeByAccessJti(db, req.user.id, req.user.jti);
			return res.json({ success: true });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	});
	// возвращает id пользователя
	router.get('/info', authMiddleware(db), async (req, res) =>
		res.json({ id: req.user.id })
	);
	return router;
}
module.exports = auth;
