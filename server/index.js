const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer'); // Added multer for file uploads

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration SQLite
const db = new sqlite3.Database('./database/portfolio.db', (err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err.message);
  } else {
    console.log('✅ Connexion à la base SQLite établie');
    initDatabase();
  }
});

// Initialisation de la base de données
function initDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    email TEXT,
    phone TEXT,
    location TEXT,
    about TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    cv_filename TEXT,
    cv_url TEXT,
    language TEXT DEFAULT 'fr',
    theme TEXT DEFAULT 'auto',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level INTEGER DEFAULT 50,
    icon TEXT,
    color TEXT DEFAULT '#3B82F6',
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    technologies TEXT,
    github_url TEXT,
    live_url TEXT,
    featured BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    location TEXT,
    start_date TEXT,
    end_date TEXT,
    description TEXT,
    gpa TEXT,
    honors TEXT,
    courses TEXT,
    achievements TEXT,
    featured BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insérer des données d'exemple
  setTimeout(insertSampleData, 100);
}

// Données d'exemple
function insertSampleData() {
  // Vérifier si la table profile est vide avant d'insérer des données par défaut
  db.get(`SELECT COUNT(*) as count FROM profile`, (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification de la table profile:', err);
      return;
    }
    
    // Si la table est vide, insérer les données par défaut
    if (row.count === 0) {
      console.log('Table profile vide, insertion des données par défaut...');
      db.run(`INSERT INTO profile (name, title, description) VALUES (?, ?, ?)`,
        ['Analyste Développeur', 'Développeur Full Stack Senior', 'Passionné par la création d\'expériences numériques exceptionnelles']);
    } else {
      console.log('Table profile contient déjà des données, pas d\'insertion automatique');
    }
  });

  // Compétences d'exemple (seulement si la table est vide)
  db.get(`SELECT COUNT(*) as count FROM skills`, (err, row) => {
    if (err) {
      console.error('Erreur lors de la vérification de la table skills:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Table skills vide, insertion des compétences par défaut...');
      const skills = [
        ['React', 'Frontend', 9, 'react', '#61DAFB', 1],
        ['Node.js', 'Backend', 8, 'nodejs', '#339933', 2],
        ['TypeScript', 'Language', 8, 'typescript', '#3178C6', 3],
        ['SQLite', 'Database', 7, 'database', '#003B57', 4],
        ['Tailwind CSS', 'Styling', 9, 'css', '#06B6D4', 5]
      ];

      skills.forEach(skill => {
        db.run(`INSERT INTO skills (name, category, level, icon, color, order_index) VALUES (?, ?, ?, ?, ?, ?)`, skill);
      });
    } else {
      console.log('Table skills contient déjà des données, pas d\'insertion automatique');
    }
  });
}

// Configuration Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Définir le dossier de destination
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Générer un nom de fichier unique
  }
});
const upload = multer({ storage: storage });

// Route pour l'upload de CV
app.post('/api/upload-cv', upload.single('cv'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const filename = req.file.filename;
    const url = `/uploads/${filename}`;
    const originalName = req.file.originalname;

    // Mettre à jour le profil avec les informations du CV
    db.run(
      'UPDATE profile SET cv_filename = ?, cv_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM profile ORDER BY id DESC LIMIT 1)',
      [originalName, url],
      function(err) {
        if (err) {
          console.error('Erreur lors de la mise à jour du profil avec le CV:', err);
          res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
        } else {
          res.json({ 
            filename: originalName,
            url: url,
            message: 'CV uploadé et profil mis à jour avec succès'
          });
        }
      }
    );
  } catch (error) {
    console.error('Erreur lors de l\'upload du CV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Route pour télécharger le CV
app.get('/api/download-cv', (req, res) => {
  db.get('SELECT cv_filename, cv_url FROM profile ORDER BY id DESC LIMIT 1', (err, row) => {
    if (err) {
      console.error('Erreur lors de la récupération du CV:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else if (!row || !row.cv_url) {
      res.status(404).json({ error: 'CV non trouvé' });
    } else {
      const filePath = path.join(__dirname, 'public', row.cv_url);
      res.download(filePath, row.cv_filename);
    }
  });
});

// Routes pour le profil
app.get('/api/profile', (req, res) => {
  db.all('SELECT * FROM profile ORDER BY id DESC LIMIT 1', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json(rows[0] || {});
    }
  });
});

app.put('/api/profile/:id', (req, res) => {
  const { id } = req.params;
  const { name, title, description, email, phone, location, about, github_url, linkedin_url, cv_filename, cv_url } = req.body;
  
  db.run(
    'UPDATE profile SET name = ?, title = ?, description = ?, email = ?, phone = ?, location = ?, about = ?, github_url = ?, linkedin_url = ?, cv_filename = ?, cv_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, title, description, email, phone, location, about, github_url, linkedin_url, cv_filename, cv_url, id],
    function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour du profil:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ message: 'Profil mis à jour avec succès' });
      }
    }
  );
});

// Routes pour les compétences
app.get('/api/skills', (req, res) => {
  db.all('SELECT * FROM skills ORDER BY order_index ASC', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des compétences:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/skills', (req, res) => {
  const { name, category, level, icon, color, order_index } = req.body;
  
  db.run(
    'INSERT INTO skills (name, category, level, icon, color, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [name, category, level, icon, color, order_index],
    function(err) {
      if (err) {
        console.error('Erreur lors de la création de la compétence:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ 
          id: this.lastID,
          name, category, level, icon, color, order_index 
        });
      }
    }
  );
});

app.put('/api/skills/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  db.run(
    `UPDATE skills SET ${setClause} WHERE id = ?`,
    [...values, id],
    function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour de la compétence:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ message: 'Compétence mise à jour avec succès' });
      }
    }
  );
});

app.delete('/api/skills/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM skills WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erreur lors de la suppression de la compétence:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json({ message: 'Compétence supprimée avec succès' });
    }
  });
});

// Routes pour les projets
app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects ORDER BY order_index ASC', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération des projets:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json(rows || []);
    }
  });
});

app.post('/api/projects', (req, res) => {
  const { title, description, technologies, github_url, live_url, featured, order_index } = req.body;
  
  db.run(
    'INSERT INTO projects (title, description, technologies, github_url, live_url, featured, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, description, technologies, github_url, live_url, featured ? 1 : 0, order_index],
    function(err) {
      if (err) {
        console.error('Erreur lors de la création du projet:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ 
          id: this.lastID,
          title, description, technologies, github_url, live_url, featured, order_index 
        });
      }
    }
  );
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates);
  const values = Object.values(updates).map(value => 
    typeof value === 'boolean' ? (value ? 1 : 0) : value
  );
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  db.run(
    `UPDATE projects SET ${setClause} WHERE id = ?`,
    [...values, id],
    function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour du projet:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ message: 'Projet mis à jour avec succès' });
      }
    }
  );
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erreur lors de la suppression du projet:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json({ message: 'Projet supprimé avec succès' });
    }
  });
});

// Routes pour l'éducation
app.get('/api/education', (req, res) => {
  db.all('SELECT * FROM education ORDER BY order_index ASC', (err, rows) => {
    if (err) {
      console.error('Erreur lors de la récupération de l\'éducation:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      // Convertir les champs JSON en objets
      const education = rows.map(row => ({
        ...row,
        courses: row.courses ? JSON.parse(row.courses) : [],
        achievements: row.achievements ? JSON.parse(row.achievements) : [],
        featured: Boolean(row.featured)
      }));
      res.json(education || []);
    }
  });
});

app.post('/api/education', (req, res) => {
  const { 
    degree, institution, location, start_date, end_date, 
    description, gpa, honors, courses, achievements, 
    featured, order_index 
  } = req.body;
  
  // Convertir les tableaux en JSON pour le stockage
  const coursesJson = JSON.stringify(courses || []);
  const achievementsJson = JSON.stringify(achievements || []);
  
  db.run(
    `INSERT INTO education (degree, institution, location, start_date, end_date, description, gpa, honors, courses, achievements, featured, order_index) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [degree, institution, location, start_date, end_date, description, gpa, honors, coursesJson, achievementsJson, featured ? 1 : 0, order_index],
    function(err) {
      if (err) {
        console.error('Erreur lors de la création de l\'éducation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ 
          id: this.lastID,
          degree, institution, location, start_date, end_date, 
          description, gpa, honors, courses, achievements, 
          featured, order_index 
        });
      }
    }
  );
});

app.put('/api/education/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Traiter les champs spéciaux
  if (updates.courses && Array.isArray(updates.courses)) {
    updates.courses = JSON.stringify(updates.courses);
  }
  if (updates.achievements && Array.isArray(updates.achievements)) {
    updates.achievements = JSON.stringify(updates.achievements);
  }
  if (typeof updates.featured === 'boolean') {
    updates.featured = updates.featured ? 1 : 0;
  }
  
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  db.run(
    `UPDATE education SET ${setClause} WHERE id = ?`,
    [...values, id],
    function(err) {
      if (err) {
        console.error('Erreur lors de la mise à jour de l\'éducation:', err);
        res.status(500).json({ error: 'Erreur serveur' });
      } else {
        res.json({ message: 'Éducation mise à jour avec succès' });
      }
    }
  );
});

app.delete('/api/education/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM education WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Erreur lors de la suppression de l\'éducation:', err);
      res.status(500).json({ error: 'Erreur serveur' });
    } else {
      res.json({ message: 'Éducation supprimée avec succès' });
    }
  });
});

// Route par défaut
app.get('*', (req, res) => {
  res.json({ message: 'API Portfolio Premium - Utilisez /api/... pour accéder aux endpoints' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur Portfolio Premium démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});
