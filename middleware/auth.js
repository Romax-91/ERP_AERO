const jwt = require('jsonwebtoken');
const { isAccessTokenValid } = require('../tool/token');

// Middleware авторизации - убираем async с функции
function authMiddleware(db) {
	return async function (req, res, next) {
		const authHeader =
			req.headers['authorization'] || req.headers['Authorization'];
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Требуется авторизация' });
		}

		const token = authHeader.substring(7);

		try {
			const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

			const valid = await isAccessTokenValid(db, payload);
			if (!valid)
				return res.status(401).json({ error: 'Токен недействителен' });

			req.user = { id: payload.sub, jti: payload.jti };
			return next();
		} catch (err) {
			console.error(err);
			return res
				.status(401)
				.json({ error: 'Неверный или истекший токен' });
		}
	};
}
module.exports = authMiddleware;
