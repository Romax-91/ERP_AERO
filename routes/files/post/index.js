const path = require('path');

function post(db) {
	return async function (req, res) {
		if (!req.file)
			return res.status(400).json({ error: 'Файл не передан' });

		try {
			const ext = path.extname(req.file.originalname).replace('.', '');

			const [result] = await db.execute(
				`INSERT INTO files 
       (user_id, original_name, stored_name, extension, mime_type, size, path) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
				[
					req.user.id,
					req.file.originalname,
					req.file.filename,
					ext || null,
					req.file.mimetype,
					req.file.size,
					req.file.path,
				]
			);

			return res.status(201).json({
				id: result.insertId,
				original_name: req.file.originalname,
				stored_name: req.file.filename,
				mime_type: req.file.mimetype,
				size: req.file.size,
				upload_date: new Date(),
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = post;
