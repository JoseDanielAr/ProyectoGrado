## Aviso importante

> Esta aplicación es un prototipo exclusivo para probar componentes de software.
>
> Esta aplicación no cuenta con aval médico ni validación clínica.
>
> El contenido sobre diabetes es simulado a partir de fuentes públicas. No la use para tomar decisiones de salud ni como reemplazo de la atención médica.

Este aviso aparece en la app al abrir o reanudar la sesión, y debe leerse antes de continuar.

---

# Prototipo de Motores de Lecciones Interactivas

Prototipo educativo en React Native que demuestra una arquitectura de motores de lecciones modulares y reutilizables, impulsados por scripts de texto y persistencia local en SQLite. El contenido temático sobre diabetes es material de muestra para ejercitar los motores — **no es una aplicación médica**.

> **Contexto:** Proyecto de grado — Ingeniería de Sistemas

---

## Stack tecnológico

| Área | Tecnología |
|---|---|
| UI | React 19 + React Native 0.81 |
| Framework | Expo SDK 54, Expo Router 6 (file-based routing) |
| Lenguaje | TypeScript (strict) |
| Base de datos | expo-sqlite |
| Animaciones | react-native-reanimated |
| Audio | expo-av (música y SFX) |
| Navegación | React Navigation 7 bajo Expo Router |
| Estilos | StyleSheet nativo (sin Tailwind/NativeWind) |
| Alias de rutas | `@/` via `metro.config.js` |

Colores de marca: primario `#0094ff`, secundario `#1B78BA`, acento `#D97706` (quizzes y resaltados).

---

## Motores interactivos

### 1. `Componente de Texto`
Motor narrativo con efecto de escritura progresiva (`RichTypewriter`) con soporte de `**negrita**` e `*itálica*` inline. Las líneas del script están numeradas (`1. "..."`, `2. "..."`). Soporta directivas de imagen dentro del script: `(Shift to NombreImagen)` para transición con fundido y `(Cut to default)` para corte directo. Incluye animación de mascota hablando con SFX mientras escribe. Tocar el cuadro de texto omite la animación o avanza al siguiente paso.

<img width="400" height="864,5" alt="Muestra de imagen en text engine" src="https://github.com/user-attachments/assets/294dca79-9bcb-4550-becb-14e0c562b112" />

### 2. `Componente de Interacción con Imágenes`
Imagen con zona táctil: bounding box en píxeles originales escalado al layout en pantalla. Reproduce SFX de acierto/error y muestra retroalimentación en el cuadro de texto. Puede usarse en lecciones o embebido en quizzes de módulo (`embedded`, `autoAdvanceOnAnswer`).

<img width="400" height="864,5" alt="Bounding box engine" src="https://github.com/user-attachments/assets/d08d3a38-f9d5-4ec3-9dd4-96ac34c133bd" />

### 3. `Componente de Preguntas de Selección Múltiple`
Selección múltiple dentro de la lección, activada en un paso específico del script (`choicesTriggerStep`). Las opciones se mezclan aleatoriamente; existen ramas de script para respuesta correcta e incorrecta. Parser: `lib/parse-prueba-test-engine-script.ts` (bloques `START TEST`, `Q2.1. CORRECT`, etc.).

<img width="400" height="864,5" alt="test engine" src="https://github.com/user-attachments/assets/38464ccc-ac17-4d44-8d38-42a2a307d632" />

### 4. `Componente de Quices`
Quiz de fin de módulo con **3 vidas**, **temporizador de 5 minutos** y cuenta regresiva 3-2-1. Soporta preguntas de selección múltiple o bounding-box (reutiliza `BoundingBoxEngine`). Puntuación: 10/10, 9/10 u 8/10 según vidas restantes. Parser: `lib/parse-quiz-conjunto-script.ts`.

<img width="400" height="864,5" alt="quiz" src="https://github.com/user-attachments/assets/8cfec190-2602-4917-a7e8-7564e47dc170" />

### 5. `Componente de Repaso`
Modo de repaso sobre preguntas de quizzes completados. Selección aleatoria con cooldown (`lib/repaso/repaso-picker.ts`). Objetivos: 10 respuestas correctas consecutivas o 10 preguntas respondidas (para misión diaria).

<img width="400" height="864,5" alt="repaso" src="https://github.com/user-attachments/assets/3d97c4eb-889e-4b84-b16b-7371f94bccda" />

---

## Modelo de scripts

Las pantallas de lección definen scripts como strings multilínea, por ejemplo:

```
"Hola, bienvenido a la lección..." (Shift to MascotaFeliz)
"Continuemos con el tema..." (Cut to default)
```

Los quizzes usan bloques estructurados:

```
START TEST QUESTION 1 - TEST ENGINE
"Pregunta aquí"
Q1.1. CORRECT "Respuesta correcta"
...
END
```

Cada pantalla mapea claves de `imageAssetMap` a rutas `require()`. Las clases encadenan fases con transiciones de fundido: `introTexto` → `bbox` → `test` → `outroTexto`.

---

## Otras funcionalidades

- **Menú principal** — puntaje, racha, accesos a Módulos, Repaso, Misiones Diarias y Ajustes.
- **Misiones diarias** — una misión por día calendario: completar una clase, repasar 10 preguntas o revisar una clase completada. Otorga +100 puntos y racha si el día anterior también se completó.
- **Ajustes** — sliders de volumen para música y SFX, persistidos en SQLite.
- **Rutas de desarrollo** (`app/prueba-*`) — sandboxes para probar cada motor de forma aislada. Son artefactos de desarrollo.

<img width="400" height="864,5" alt="menus" src="https://github.com/user-attachments/assets/64205bc2-0794-4191-9fad-2cd0333ddc3c" />

---

<img width="400" height="864,5" alt="Ajustes" src="https://github.com/user-attachments/assets/74d389e2-bfae-46b6-acfe-de103322f9ad" />

---

## Capa de datos (SQLite)

Schema (`lib/db/schema.ts`): `Estado`, `Usuario` (puntaje, racha, configuración de audio, campos de misión diaria), `Modulo`, `Clase`, `Quiz`, `UsuarioModulo`, `UsuarioClase`, `UsuarioQuiz`.


---
