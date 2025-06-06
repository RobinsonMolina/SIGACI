# Sistema Integral de Gestión Académica y Control de Inscripciones (SIGACI)

Este proyecto consiste en una aplicación completa para la gestión académica de una institución educativa. El sistema permite administrar estudiantes, asignaturas, docentes, inscripciones y calificaciones de manera integral, proporcionando herramientas para el seguimiento académico y la toma de decisiones administrativas.

## Objetivo

Proveer una solución integral que permita gestionar eficientemente todos los aspectos académicos de una institución educativa, desde el registro de estudiantes hasta el seguimiento de su progreso académico, facilitando la administración de períodos académicos, inscripciones y evaluaciones.

## Características del Proyecto

### Gestión de Estudiantes
- **Registro de estudiantes**: Creación de perfiles completos con información personal y académica.
- **Actualización de datos**: Modificación de información personal y académica de los estudiantes.
- **Seguimiento académico**: Control del semestre actual y progreso de cada estudiante.
- **Promoción automática**: Avance de semestre basado en créditos aprobados (≥15 créditos).
- **Gestión de asignaturas**: Control de materias actuales y aprobadas por estudiante.
- **Eliminación controlada**: Eliminación segura con limpieza de registros relacionados.

### Gestión de Asignaturas
- **Registro de materias**: Creación de asignaturas con información detallada (créditos, semestre, docente, período académico, cupos disponibles).
- **Control de prerrequisitos**: Registro y validación de asignaturas que requieren aprobación previa.
- **Actualización avanzada**: Soporte para modificar datos clave como docente, período y cupos, con validaciones consistentes.
- **Gestión de referencias cruzadas**: Actualización automática de referencias en prerrequisitos y registros de estudiantes si se modifica el ID.
- **Seguimiento de inscripciones**: Control de estudiantes matriculados por asignatura.
- **Estadísticas por materia**: Análisis de rendimiento y tasas de aprobación.

### Sistema de Inscripciones
- **Inscripción inteligente**: Validación automática de prerrequisitos antes de permitir inscripciones.
- **Control de créditos**: Límites dinámicos basados en el rendimiento académico del estudiante.
  - Estudiantes con promedio ≥ 3.6: hasta 24 créditos.
  - Estudiantes con promedio < 3.6: hasta 20 créditos.
  - Primer semestre: hasta 24 créditos.
- **Cancelación de inscripciones**: Proceso controlado de retiro de materias.
- **Historial de inscripciones**: Seguimiento completo del registro académico.

### Gestión de Calificaciones
- **Registro de notas**: Captura de calificaciones finales (escala 0.0 - 5.0).
- **Validación automática**: Verificación de rangos y consistencia de datos.
- **Actualización de estados**: Cambio automático entre "Inscrito", "Aprobado" y "Reprobado".
- **Cálculo de promedios**:
  - Promedio ponderado: Considera todas las materias cursadas.
  - Promedio acumulado: Solo materias aprobadas con ≥15 créditos.
- **Estadísticas académicas**: Análisis de rendimiento por estudiante y asignatura.

### Gestión de Períodos Académicos
- **Creación de períodos**: Definición de semestres o períodos académicos.
- **Control de períodos activos**: Un solo período activo a la vez.
- **Cambio de período**: Proceso automatizado que actualiza el semestre de todos los estudiantes.
- **Seguimiento temporal**: Control de fechas de inicio y fin de cada período.

### Reportes y Estadísticas
- **Estudiantes por semestre**: Agrupación y análisis por nivel académico.
- **Rendimiento académico**: Promedios y estadísticas de aprobación.
- **Análisis por asignatura**: Estadísticas de cada materia (inscritos, aprobados, promedio).
- **Seguimiento de promociones**: Control de estudiantes que avanzan de semestre.

### Funcionalidades Avanzadas
- **Validaciones integrales**: Verificación de prerrequisitos, límites de créditos y consistencia de datos.
- **Secuencias automáticas**: Generación automática de IDs únicos para inscripciones y notas.
- **Relaciones consistentes**: Mantenimiento automático de relaciones entre entidades.
- **Notificaciones informativas**: Mensajes detallados sobre operaciones realizadas.
- **Manejo de errores**: Gestión robusta de excepciones con mensajes informativos.

## Tecnologías Utilizadas

### Backend
- **Node.js**  
- **Express** 
- **dotenv**
- **Mongoose** 
- **Nodemon**

### Frontend
- **HTML**  
- **Bootstrap**
- **Font Awesome**

### Base de Datos
- **MongoDB Atlas**

### Controladores:
- `estudianteController.js`: Gestión completa de estudiantes.
- `asignaturaController.js`: Registro, validación y actualización avanzada de asignaturas y prerrequisitos.
- `inscripcionController.js`: Control de inscripciones y validación de créditos.
- `notaController.js`: Registro y validación de calificaciones.
- `periodoController.js`: Administración de períodos académicos.

### Arquitectura
- API RESTful modular

### Validaciones
- Verificación de integridad de datos en múltiples niveles.

## Instalación

1. Clona el repositorio
   ```bash
   git clone https://github.com/RobinsonMolina/SIGACI
   ```
2. Instalar dependencias
   ```bash
   npm install
   ```

3. Ejecutar servidor
   ```bash
   npm start
   ```