-- =========================
-- INSERT DATA (SEED)
-- =========================

-- Estado
INSERT INTO Estado (EstadoID, NombreEstado) VALUES
(1, 'No Completado'),
(2, 'Completado');

-- Modulo
INSERT INTO Modulo (ModuloID) VALUES
(1),
(2);

-- Usuario
INSERT INTO Usuario (UsuarioID, Racha, Puntaje, ConfMusica, ConfSFX) VALUES
(1, 0, 0, 0, 0);

-- Clase
INSERT INTO Clase (ClaseID, ModuloID, PuntajeDadoClase) VALUES
(1, 1, 100),
(2, 1, 100),
(3, 1, 100),
(4, 1, 100);

-- Quiz
INSERT INTO Quiz (QuizID, ModuloID, PuntajeDadoQuiz) VALUES
(1, 1, 500);

-- UsuarioModulo
INSERT INTO UsuarioModulo (UsuarioID, ModuloID, EstadoID) VALUES
(1, 1, 1),
(1, 2, 1);

-- UsuarioClase
INSERT INTO UsuarioClase (UsuarioID, ClaseID, EstadoID) VALUES
(1, 1, 1),
(1, 2, 1),
(1, 3, 1),
(1, 4, 1);

-- UsuarioQuiz
INSERT INTO UsuarioQuiz (UsuarioID, QuizID, EstadoID, Resultado) VALUES
(1, 1, 1, 0);