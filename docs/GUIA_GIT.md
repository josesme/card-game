# 🔀 GUÍA: TRABAJAR CON GIT EN COMPILE

## 📌 Visión General

Ahora el proyecto está en **Git**, lo que significa:

✅ Historial completo de cambios  
✅ Trabajo colaborativo  
✅ Ramas para diferentes features  
✅ Rollback fácil si algo falla  
✅ Control de versiones profesional  

---

## 🚀 INICIO RÁPIDO

### 1. Clonar el Repositorio

```bash
# Opción A: HTTPS
git clone https://github.com/your-username/compile-card-game.git
cd compile-card-game

# Opción B: SSH
git clone git@github.com:your-username/compile-card-game.git
cd compile-card-game
```

### 2. Ver Estado

```bash
# Ver rama actual y cambios
git status

# Ver historial de commits
git log --oneline

# Ver diferencias
git diff
```

### 3. Hacer Cambios

```bash
# Editar archivos en: src/, data/, etc.

# Ver qué cambió
git diff

# Agregar cambios
git add .

# O agregar archivos específicos
git add src/logic.js
git add src/style.css

# Hacer commit
git commit -m "feat: agregar nueva funcionalidad"

# Ver commit creado
git log --oneline | head -1
```

---

## 📂 ESTRUCTURA DEL PROYECTO

```
compile-project/
├── .git/                  # Repositorio Git (no tocar)
├── .gitignore             # Archivos a ignorar
├── README.md              # Este archivo
├── package.json           # Configuración del proyecto
│
├── src/                   # Código fuente - EDITAR AQUÍ
│   ├── index.html         # Interfaz
│   ├── logic.js           # Motor de juego
│   ├── abilities-engine.js# Motor de habilidades
│   └── style.css          # Estilos
│
├── data/                  # Datos del juego - EDITAR AQUÍ
│   └── cards.json         # Base de datos de cartas
│
└── docs/                  # Documentación
    └── (futuro)
```

---

## 🎯 FLUJO TÍPICO DE TRABAJO

### Día 1: Empezar una Feature

```bash
# 1. Actualizar rama main
git checkout main
git pull origin main

# 2. Crear rama para la feature
git checkout -b feature/ai-intelligence

# 3. Editar archivos
nano src/logic.js
# (hacer cambios...)

# 4. Ver cambios
git status
git diff
```

### Día 2: Hacer Commits

```bash
# 1. Agregar cambios
git add src/logic.js

# 2. Hacer commit
git commit -m "feat: implementar evaluación de tablero para IA"

# 3. Hacer más cambios
nano src/logic.js
# (más cambios...)

# 4. Commit incremental
git commit -am "feat: agregar minimax básico"

# 5. Ver historial
git log --oneline --all
```

### Día 3: Terminar Feature

```bash
# 1. Actualizar main
git checkout main
git pull origin main

# 2. Volver a feature
git checkout feature/ai-intelligence

# 3. Mergear en main
git merge main

# 4. Push a repositorio
git push origin feature/ai-intelligence

# 5. Crear Pull Request en GitHub
# (desde la web)

# 6. Una vez mergeado
git checkout main
git pull origin main
```

---

## 🌳 RAMAS PRINCIPALES

### `main` (Producción)
```bash
# Ver rama main
git checkout main

# Es la versión estable
# Siempre funciona
# Nueva feature aquí cuando está lista
```

### `develop` (Desarrollo)
```bash
# Ver rama develop
git checkout develop

# Rama de trabajo
# Integra features
# Pruebas antes de main
```

### `feature/*` (Mis Cambios)
```bash
# Crear nueva feature
git checkout -b feature/mi-feature

# Trabajo aquí
# Sin afectar main

# Cuando termina
git checkout develop
git merge feature/mi-feature
```

---

## 📝 HACER COMMITS CORRECTAMENTE

### Formato Convencional

```
<tipo>: <descripción>

<cuerpo opcional>

<footer opcional>
```

### Ejemplos

```bash
# Feature nueva
git commit -m "feat: agregar IA con minimax"

# Corrección de bug
git commit -m "fix: corregir cálculo de puntuación"

# Documentación
git commit -m "docs: actualizar guía de desarrollo"

# Cambio de estilo
git commit -m "style: reformatear código"

# Refactoring
git commit -m "refactor: simplificar motor de habilidades"

# Tests
git commit -m "test: agregar tests para compilación"

# Con descripción larga
git commit -m "feat: agregar IA inteligente

- Implementar evaluación de tablero
- Agregar minimax básico
- Optimizar decisiones"
```

---

## 🔄 SINCRONIZAR CON SERVIDOR

### Actualizar tu rama

```bash
# Traer cambios del servidor
git fetch origin

# Ver cambios disponibles
git log --oneline origin/main..main

# Integrar cambios
git pull origin main
```

### Subir tus cambios

```bash
# Ver cambios locales
git log --oneline main..origin/main

# Subir commits
git push origin feature/mi-feature

# O subir a main (si tienes permisos)
git push origin main
```

### Actualizar feature desde main

```bash
# Traer cambios recientes
git fetch origin

# Rebasar tu feature
git rebase origin/main

# O mergear
git merge origin/main
```

---

## 🚨 RESOLVER CONFLICTOS

### Si hay conflicto al mergear

```bash
# 1. Intentar mergear
git merge origin/main
# CONFLICT: Merge conflict in src/logic.js

# 2. Ver archivos con conflicto
git status

# 3. Editar archivo
nano src/logic.js
# Ver secciones:
# <<<<<<< HEAD
# Tu código
# =======
# Código del servidor
# >>>>>>> origin/main

# 4. Resolver manualmente
# Eliminar marcadores, dejar código correcto

# 5. Agregar resolución
git add src/logic.js

# 6. Terminar merge
git commit -m "merge: resolver conflictos en logic.js"
```

---

## 📊 VER HISTORIAL

### Commits

```bash
# Últimos 5 commits
git log --oneline -5

# Commits de hoy
git log --since="1 day ago"

# Commits con detalles
git log --stat

# Commits de una rama
git log feature/ai-intelligence

# Commits de un archivo
git log src/logic.js

# Con gráfico
git log --graph --oneline --all
```

### Cambios

```bash
# Ver diferencias no commitadas
git diff

# Ver diferencias de un archivo
git diff src/logic.js

# Ver diferencias entre ramas
git diff main..feature/mi-feature

# Ver cambios desde hace 1 día
git log -p --since="1 day ago"
```

---

## ↩️ DESHACER CAMBIOS

### Si no has hecho commit

```bash
# Deshacer cambios en un archivo
git checkout src/logic.js

# O deshacer todo
git reset --hard HEAD
```

### Si hiciste commit

```bash
# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (eliminar cambios)
git reset --hard HEAD~1

# Revertir commit sin eliminar historial
git revert <commit-hash>
```

### Si ya pusheaste

```bash
# Ver qué se pusheó
git log origin/main..main

# Revertir commit que ya está en servidor
git revert <commit-hash>
git push origin feature/mi-feature
```

---

## 🎯 WORKFLOW RECOMENDADO PARA COMPILE

### Semana 1: Feature A

```bash
# Crear rama
git checkout -b feature/phase-2-ai
git push -u origin feature/phase-2-ai

# Trabajo diario
git add src/logic.js
git commit -m "feat: implementar evaluación básica"

# Día 2
git commit -m "feat: agregar minimax v1"

# Día 3
git commit -m "fix: optimizar minimax"

# Terminar
git push origin feature/phase-2-ai
# (Pull Request en GitHub)
```

### Semana 2: Feature B (mientras Feature A está en review)

```bash
# Basarse en main (no en feature anterior)
git checkout -b feature/phase-3-rules

# Trabajo
git commit -m "feat: agregar Control Component"

# Push y PR cuando termine
git push origin feature/phase-3-rules
```

### Integración

```bash
# Cuando Feature A está approved
git checkout main
git pull origin main
# Automáticamente integrada

# Feature B puede basarse en main actualizado
git checkout feature/phase-3-rules
git merge main
git commit -m "merge: actualizar con Feature A"
```

---

## 📋 CHECKLIST PARA COMMITS

Antes de hacer commit:

- [ ] Revisé los cambios: `git diff`
- [ ] El código funciona en local
- [ ] Sin archivos temporales o backup
- [ ] Mensaje descriptivo en inglés
- [ ] Un cambio lógico por commit (no todo junto)

Antes de push:

- [ ] Actualicé con `git pull`
- [ ] Sin conflictos
- [ ] Tests pasan (cuando existan)
- [ ] Documentación actualizada si es necesario

---

## 🔐 MEJORES PRÁCTICAS

### DO ✅

```bash
# ✅ Commits frecuentes y pequeños
git commit -m "feat: agregar funcionalidad X"

# ✅ Ramas descriptivas
git checkout -b feature/ai-strategy

# ✅ Mensajes claros
git commit -m "fix: corregir bug en compilación"

# ✅ Actualizar antes de push
git pull origin main

# ✅ Una feature por rama
git checkout -b feature/ai-only
```

### DON'T ❌

```bash
# ❌ Commits gigantes con todo junto
git commit -m "cambios varios"

# ❌ Ramas con nombres confusos
git checkout -b test123

# ❌ Mensajes vacíos
git commit -m "."

# ❌ Push directo a main sin review
git push origin main (sin PR)

# ❌ Múltiples features en una rama
git checkout -b feature/ai-rules-docs
```

---

## 🆘 COMANDOS DE EMERGENCIA

```bash
# "Me perdí, quiero ver todo"
git status

# "¿Qué hice hoy?"
git log --since="1 day ago" --oneline

# "Quiero deshacer todo"
git reset --hard HEAD

# "¿Cuál es mi rama?"
git branch

# "¿Quién cambió este archivo?"
git log -p src/logic.js

# "¿Qué cambios no hice commit?"
git stash
git stash pop

# "¿Cómo fue este archivo?"
git show HEAD~5:src/logic.js
```

---

## 📚 RECURSOS

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

## ✨ CONCLUSIÓN

Con Git podemos:

✅ Tener historial completo de cambios  
✅ Trabajar en features sin afectar main  
✅ Colaborar fácilmente  
✅ Rollback si algo falla  
✅ Mantener código limpio  

**¡A programar!** 🚀

