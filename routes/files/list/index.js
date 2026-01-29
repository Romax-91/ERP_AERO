function list(db) {
	return async function (req, res) {
		try {
			const listSize = parseInt(req.query.list_size, 10) || 10;
			const page = parseInt(req.query.page, 10) || 1;
			const limit = listSize > 0 ? listSize : 10;
			const offset = (page - 1) * limit;

			const [rows] = await db.execute(
				'SELECT id, original_name, extension, mime_type, size, upload_date FROM files WHERE user_id = ? ORDER BY upload_date DESC LIMIT ? OFFSET ?',
				[req.user.id, limit, offset]
			);

			const [countRows] = await db.execute(
				'SELECT COUNT(*) as total FROM files WHERE user_id = ?',
				[req.user.id]
			);

			const total = countRows[0].total;
			const totalPages = Math.ceil(total / limit) || 1;

			return res.json({
				page,
				list_size: limit,
				total,
				total_pages: totalPages,
				items: rows,
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = list;
