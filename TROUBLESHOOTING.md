# 🔧 Guide de Dépannage - Portfolio

## 🚨 Erreurs Courantes et Solutions

### **1. Erreur PowerShell : `&&` non supporté**

**❌ Erreur :**
```
The token '&&' is not a valid statement separator in this version.
```

**✅ Solution :**
```powershell
# Au lieu de : cd server && npm start
# Utilisez :
cd server
npm start

# Ou dans un script :
cd server; npm start
```

### **2. Serveur Backend ne démarre pas**

**❌ Erreur :** `Port 5000 already in use`

**✅ Solution :**
```powershell
# Tuer le processus sur le port 5000
netstat -ano | findstr :5000
taskkill /PID [PID] /F

# Ou redémarrer le serveur
cd server
npm start
```

### **3. Erreurs de compilation TypeScript**

**❌ Erreur :** `Cannot find module` ou `Type errors`

**✅ Solution :**
```powershell
# Nettoyer et réinstaller les dépendances
cd client
rm -rf node_modules
npm install

# Vérifier les types
npm run type-check
```

### **4. Erreurs d'upload de CV**

**❌ Erreur :** `CV non disponible` ou `Erreur lors de l'upload`

**✅ Solutions :**

1. **Vérifier que le serveur backend fonctionne :**
   ```powershell
   # Test de l'API
   curl http://localhost:5000/api/profile
   ```

2. **Vérifier le dossier uploads :**
   ```powershell
   # Créer le dossier s'il n'existe pas
   mkdir server/public/uploads
   ```

3. **Vérifier les permissions :**
   ```powershell
   # Donner les permissions d'écriture
   icacls server/public/uploads /grant Everyone:F
   ```

### **5. Erreurs de base de données**

**❌ Erreur :** `Database connection failed`

**✅ Solution :**
```powershell
# Vérifier que SQLite est installé
sqlite3 --version

# Recréer la base de données
cd server
rm database/portfolio.db
npm start
```

### **6. Erreurs de CORS**

**❌ Erreur :** `CORS policy` dans la console

**✅ Solution :**
Vérifier que le backend a bien la configuration CORS :
```javascript
app.use(cors());
```

### **7. Erreurs de port déjà utilisé**

**❌ Erreur :** `Port 3001 already in use`

**✅ Solution :**
```powershell
# Trouver le processus
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# Ou utiliser un autre port
cd client
npm run dev -- --port 3002
```

## 🚀 Script de Démarrage Automatique

### **Utiliser le script PowerShell :**
```powershell
# Exécuter le script de démarrage
.\start-servers.ps1
```

### **Démarrage manuel :**

**Terminal 1 - Backend :**
```powershell
cd server
npm start
```

**Terminal 2 - Frontend :**
```powershell
cd client
npm run dev
```

## 🔍 Vérification du Système

### **1. Test des APIs :**
```powershell
# Test du profil
curl http://localhost:5000/api/profile

# Test des compétences
curl http://localhost:5000/api/skills

# Test des projets
curl http://localhost:5000/api/projects
```

### **2. Test de l'upload :**
```powershell
# Test d'upload de CV (avec un fichier test)
curl -X POST -F "cv=@test.pdf" http://localhost:5000/api/upload-cv
```

### **3. Vérification des fichiers :**
```powershell
# Vérifier la structure
ls server/public/uploads
ls server/database
```

## 📋 Checklist de Dépannage

- [ ] **Backend démarré** sur le port 5000
- [ ] **Frontend démarré** sur le port 3001
- [ ] **Base de données** créée et accessible
- [ ] **Dossier uploads** existe avec permissions
- [ ] **APIs répondent** correctement
- [ ] **CORS configuré** dans le backend
- [ ] **Dépendances installées** (npm install)
- [ ] **Ports libres** (5000 et 3001)

## 🆘 Support

Si les erreurs persistent :

1. **Redémarrer** tous les serveurs
2. **Nettoyer** les caches (node_modules)
3. **Vérifier** les logs dans la console
4. **Tester** les APIs individuellement
5. **Vérifier** la configuration réseau/firewall

---

**💡 Conseil :** Utilisez toujours le script `start-servers.ps1` pour un démarrage automatique et sans erreur !
