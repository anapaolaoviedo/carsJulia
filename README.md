# Modelo de Tráfico con Semáforos - Simulación Basada en Agentes

## Descripción del Proyecto

Este proyecto implementa una simulación basada en agentes (ABM) de un cruce de calles con semáforos sincronizados y múltiples vehículos. Desarrollado en Julia utilizando la librería Agents.jl, con un frontend interactivo en React.

El proyecto se desarrolló en tres etapas progresivas, cada una agregando complejidad al modelo de simulación.

---

## Estructura del Proyecto

```
.
├── simple.jl              # Modelo de simulación principal
├── webapi.jl             # API REST con Genie.jl
├── frontend/
│   └── src/
│       └── App.jsx       # Interfaz de usuario React
├── README.md             # Este archivo
└── docs/
    
```

---

## Tecnologías Utilizadas

### Backend (Julia)
- **Agents.jl** - Framework de modelado basado en agentes
- **Genie.jl** - Framework web para API REST
- **StaticArrays.jl** - Vectores estáticos para posiciones
- **Distributions.jl** - Distribuciones estadísticas

### Frontend (React)
- **React** - Biblioteca de interfaz de usuario
- **SVG** - Visualización gráfica del cruce
- **Fetch API** - Comunicación con backend

---

## Pregunta 1: Semáforos Sincronizados

### Objetivo
Implementar un cruce con dos semáforos sincronizados que sigan el ciclo mexicano (Verde → Amarillo → Rojo).

### Características Implementadas
- ✅ Agente `TrafficLight` con propiedades: color, timer, is_vertical
- ✅ Ciclo de semáforo: Verde (10) → Amarillo (4) → Rojo (14)
- ✅ Sincronización: cuando uno está verde, el otro está rojo
- ✅ Espacio cuadrado 20x20
- ✅ Visualización de calles en frontend

### Decisiones de Diseño
- **Scheduler:** `ByID()` para orden consistente
- **Espacio:** No periódico para simular calles reales
- **Posicionamiento:** Semáforos en posiciones estratégicas del cruce

### Código Principal
```julia
@agent struct TrafficLight(ContinuousAgent{2,Float64})
    color::Symbol = :green
    timer::Int = 0
    is_vertical::Bool = false
end

const GREEN_TIME = 10
const YELLOW_TIME = 4
const RED_TIME = 14
```

---

## Pregunta 2: Un Auto con Detección de Semáforos

### Objetivo
Agregar un auto que se detenga ante semáforos en amarillo o rojo.

### Características Implementadas
- ✅ Agente `Car` con movimiento horizontal
- ✅ Detección de semáforo adelante
- ✅ Detención ante amarillo/rojo
- ✅ Uso de `Union{Car, TrafficLight}` para múltiples tipos
- ✅ Scheduler `ByType` para evitar condiciones de carrera

### Decisiones de Diseño

#### Scheduler ByType
Cambio crítico para evitar que el auto se pase el alto:
```julia
scheduler = Schedulers.ByType(true, true, TrafficLight, Car)
```
**Ejecución:** Primero semáforos, después autos.

#### Detección de Semáforo
```julia
function find_traffic_light_ahead(car, model)
    # Busca semáforo en mismo carril
    # Dentro de STOP_DISTANCE (2.0 unidades)
    # Verifica que esté adelante
end
```

#### Lógica de Detención
```julia
function should_stop(car, model)
    light = find_traffic_light_ahead(car, model)
    return light !== nothing && (light.color == :yellow || light.color == :red)
end
```

### Problemas Resueltos
1. **Auto se pasa el alto** → Scheduler ByType
2. **Auto aparece en cruce** → Posicionamiento aleatorio excluyendo área de semáforo
3. **Detección inconsistente** → Verificación de mismo carril + distancia

---

## Pregunta 3: Múltiples Autos con Aceleración/Desaceleración

### Objetivo
Completar la simulación con múltiples autos en ambas calles, aceleración/desaceleración, y monitoreo de velocidad promedio.

### Características Implementadas
- ✅ Múltiples autos por calle (configurable: 3, 5, 7)
- ✅ Autos en calle horizontal y vertical
- ✅ Aceleración progresiva (+0.05 por paso)
- ✅ Desaceleración progresiva (-0.1 por paso)
- ✅ Detección de autos adelante
- ✅ Velocidades aleatorias por auto
- ✅ Monitoreo de velocidad promedio
- ✅ Visualización con código de colores

### Parámetros del Sistema

#### Constantes de Movimiento
```julia
const ACCELERATION = 0.05
const DECELERATION = 0.1
const MIN_SPEED = 0.0
```

#### Distancias de Detección
```julia
const STOP_DISTANCE = 2.5          # Para semáforos
const CAR_DETECTION_DISTANCE = 1.5 # Para autos
```

### Comportamiento de los Autos

#### Aceleración/Desaceleración
- **Sin obstáculos:** Acelera hasta velocidad máxima
- **Semáforo amarillo/rojo:** Desacelera hasta detenerse
- **Auto adelante:** Desacelera para mantener distancia

#### Velocidades Aleatorias
Cada auto tiene características únicas:
```julia
initial_speed = rand(Uniform(0.3, 0.8))  # Velocidad inicial
max_speed = rand(Uniform(0.8, 1.2))      # Velocidad máxima
```

Esto simula diferentes tipos de conductores.

### Monitoreo de Velocidad

#### Función de Cálculo
```julia
function calculate_average_speed(model)
    total_speed = 0.0
    car_count = 0
    
    for agent in allagents(model)
        if agent isa Car
            speed = sqrt(agent.vel[1]^2 + agent.vel[2]^2)
            total_speed += speed
            car_count += 1
        end
    end
    
    return car_count > 0 ? total_speed / car_count : 0.0
end
```

#### Experimentos Automatizados
```julia
avg_3 = run_experiment(3, 200)  # 3 autos por calle, 200 pasos
avg_5 = run_experiment(5, 200)  # 5 autos por calle, 200 pasos
avg_7 = run_experiment(7, 200)  # 7 autos por calle, 200 pasos
```

### Resultados Experimentales

| Autos/Calle | Velocidad Promedio | Comportamiento |
|-------------|-------------------|----------------|
| 3 | ~0.72 | Tráfico fluido, pocas interacciones |
| 5 | ~0.57 | Balance entre fluidez y congestión |
| 7 | ~0.39 | Alta congestión, efecto dominó frecuente |

### Fenómenos Observados

1. **Ondas de tráfico:** Frenado de un auto causa efecto cascada
2. **Agrupamiento:** Autos se acumulan detrás de semáforos
3. **Variabilidad:** Velocidad fluctúa constantemente por aceleración/desaceleración
4. **Densidad vs Velocidad:** Relación inversa no lineal

---

## Arquitectura del Sistema

### Backend (Julia)

#### simple.jl
Contiene el modelo de simulación completo:
- Definición de agentes (Car, TrafficLight)
- Funciones de comportamiento
- Lógica de detección
- Inicialización del modelo
- Funciones de monitoreo

#### webapi.jl
API REST con dos endpoints:

**POST /simulations**
- Crea nueva simulación
- Parámetros: `cars_per_street` (opcional, default: 5)
- Retorna: ID de simulación, estado inicial

**GET /simulations/:id**
- Avanza un paso de simulación
- Retorna: Estado actualizado de autos y semáforos, velocidad promedio

### Frontend (React)

#### App.jsx
Interfaz interactiva con:
- Controles de simulación (Setup, Start, Stop)
- Selector de densidad de tráfico
- Canvas SVG con visualización en tiempo real
- Paneles de información
- Código de colores dinámico

#### Visualización
- **Calles:** Gris oscuro con línea amarilla divisoria
- **Semáforos:** Círculos de color con temporizador
- **Autos:** Círculos con código de colores según velocidad
  - 🟢 Verde: >70% velocidad máxima
  - 🟠 Naranja: 30-70% velocidad máxima
  - 🔶 Naranja oscuro: 10-30% velocidad máxima
  - ⚫ Gris: <10% (detenido)

---

## Instalación y Ejecución

### Prerrequisitos
- Julia 1.9 o superior
- Node.js 16 o superior
- npm o yarn

### Instalación

#### Backend
```bash
# Instalar dependencias de Julia
julia
julia> using Pkg
julia> Pkg.add(["Agents", "Genie", "StaticArrays", "Distributions"])
```

#### Frontend
```bash
cd frontend
npm install
```

### Ejecución

#### 1. Iniciar Backend
```bash
julia webapi.jl
```
Backend escuchará en `http://localhost:8000`

#### 2. Iniciar Frontend
```bash
cd frontend
npm run dev
```
Frontend disponible en `http://localhost:5173`

#### 3. Usar la Aplicación
1. Seleccionar número de autos por calle (1-7)
2. Click en "Setup" para inicializar
3. Click en "Start" para comenzar simulación
4. Click en "Stop" para pausar
5. Observar velocidad promedio y comportamiento de autos

---

## Decisiones de Diseño Importantes

### 1. Despacho Múltiple (Multiple Dispatch)

Julia permite definir múltiples versiones de la misma función según el tipo:

```julia
function agent_step!(agent::TrafficLight, model)
    trafficlight_step!(agent, model)
end

function agent_step!(agent::Car, model)
    car_step!(agent, model)
end
```

### 2. Scheduler ByType

Crítico para evitar condiciones de carrera:
- Semáforos se actualizan primero
- Todos los autos ven el mismo estado
- Previene que autos se pasen el alto

### 3. Detección por Carril

Verificación estricta de mismo carril:
```julia
car_on_horizontal = abs(car.pos[2] - 10.0) < 1.0
car_on_vertical = abs(car.pos[1] - 10.0) < 1.0
```

### 4. Aceleración Asimétrica

Desaceleración mayor que aceleración:
- Acelerar: +0.05
- Frenar: -0.1

Simula comportamiento realista y promueve tráfico seguro.

### 5. Velocidades Heterogéneas

Cada auto tiene velocidades aleatorias:
- Mayor realismo
- Patrones de tráfico más complejos
- Diferentes "personalidades" de conductores

---

## Limitaciones Conocidas

1. **Sin cambio de carril:** Autos no pueden esquivar tráfico lento
2. **Movimiento rectilíneo:** Autos no giran en el cruce
3. **Colisiones simplificadas:** Detección básica de proximidad
4. **Semáforos fijos:** No se adaptan a densidad de tráfico
5. **2D simplificado:** No considera múltiples carriles por dirección



---




### Impacto del Proyecto

Este proyecto demuestra cómo la simulación basada en agentes puede:
- Estudiar sistemas complejos de forma controlada
- Evaluar políticas sin implementación real
- Generar insights sobre fenómenos emergentes
- Servir como herramienta educativa sobre tráfico urbano

---

## Referencias

- [Agents.jl Documentation](https://juliadynamics.github.io/Agents.jl/stable/)
- [NetLogo Traffic Models](https://ccl.northwestern.edu/netlogo/models/)
- [Genie.jl Documentation](https://genieframework.com/)
- [React Documentation](https://react.dev/)

---

## Autor

Proyecto desarrollado para el curso de Modelado Basado en Agentes  
Octubre 2025

---

## Licencia

Este proyecto es de uso académico.