const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Генерация пары токенов и запись в БД
async function generateTokenPair(db, userId, deviceInfo) {
	// Node.js 16+ (в т.ч. Win32) поддерживает crypto.randomUUID()
	const accessJti = crypto.randomUUID();
	const refreshJti = crypto.randomUUID();

	const accessToken = jwt.sign(
		{ sub: userId, jti: accessJti },
		process.env.JWT_ACCESS_SECRET,
		{ expiresIn: process.env.JWT_ACCESS_EXPIRE }
	);

	const refreshToken = jwt.sign(
		{ sub: userId, jti: refreshJti },
		process.env.JWT_REFRESH_SECRET,
		{ expiresIn: process.env.JWT_REFRESH_EXPIRE }
	);

	const [result] = await db.execute(
		`INSERT INTO user_tokens 
     (user_id, access_jti, refresh_jti, access_expires_at, refresh_expires_at, device_info) 
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), DATE_ADD(NOW(), INTERVAL 7 DAY), ?)`,
		[userId, accessJti, refreshJti, deviceInfo || null]
	);

	return {
		accessToken,
		refreshToken,
		tokenRecordId: result.insertId,
	};
}

// Проверка, что access токен не отозван
async function isAccessTokenValid(db, payload) {
	const [rows] = await db.execute(
		'SELECT is_revoked, access_expires_at FROM user_tokens WHERE user_id = ? AND access_jti = ? LIMIT 1',
		[payload.sub, payload.jti]
	);
	if (rows.length === 0) return false;
	const token = rows[0];
	if (token.is_revoked) return false;
	return true;
}

// Отзыв токена по access jti (используется при logout)
async function revokeByAccessJti(db, userId, accessJti) {
	return await db.execute(
		'UPDATE user_tokens SET is_revoked = 1 WHERE user_id = ? AND access_jti = ?',
		[userId, accessJti]
	);
}

// Работа с refresh токеном при обновлении
async function rotateRefreshToken(db, oldRefreshToken) {
	let payload;
	try {
		payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
	} catch (e) {
		return null;
	}

	const [rows] = await db.execute(
		'SELECT * FROM user_tokens WHERE user_id = ? AND refresh_jti = ? AND is_revoked = 0 LIMIT 1',
		[payload.sub, payload.jti]
	);

	if (rows.length === 0) return null;

	// Отзываем старую запись
	await db.execute('UPDATE user_tokens SET is_revoked = 1 WHERE id = ?', [
		rows[0].id,
	]);

	// Создаем новую пару
	const deviceInfo = rows[0].device_info;
	const { accessToken, refreshToken } = await generateTokenPair(
		db,
		payload.sub,
		deviceInfo
	);

	return { accessToken, refreshToken, userId: payload.sub };
}

module.exports = {
	generateTokenPair,
	rotateRefreshToken,
	revokeByAccessJti,
	isAccessTokenValid,
};
