function get(db) {
	return async function (req, res) {
		const fileId = parseInt(req.params.id, 10);
		if (Number.isNaN(fileId))
			return res.status(400).json({ error: 'Некорректный id файла' });

		try {
			const [rows] = await db.execute(
				'SELECT id, original_name, extension, mime_type, size, upload_date FROM files WHERE id = ? AND user_id = ? LIMIT 1',
				[fileId, req.user.id]
			);

			if (rows.length === 0)
				return res.status(404).json({ error: 'Файл не найден' });

			return res.json(rows[0]);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = get;
